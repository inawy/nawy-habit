import { createFileRoute, Link } from "@tanstack/react-router";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  BackupError,
  exportBackup,
  importBackup,
  parseBackup,
  requestPersistentStorage,
  type Backup,
} from "@/lib/db/backup-repo";
import { todayKey } from "@/lib/date/day-key";
import { num } from "@/lib/format/numbers";
import { useTheme, type ThemePreference } from "@/lib/theme/theme-provider";

const themeOptions: readonly { value: ThemePreference; label: string }[] = [
  { value: "system", label: "حسب الجهاز" },
  { value: "light", label: "نهاري" },
  { value: "dark", label: "ليلي" },
];

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات — ناوي للعادات" },
      { name: "description", content: "اختار مظهر التطبيق واحتفظ بنسخة احتياطية من عاداتك." },
      { property: "og:title", content: "الإعدادات — ناوي للعادات" },
      { property: "og:description", content: "نسخ احتياطي واسترجاع لعاداتك بملف واحد." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Backup | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    void navigator.storage?.persisted?.().then(setPersisted);
  }, []);

  const onExport = async () => {
    const data = await exportBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nawy-habit-${todayKey()}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success(`تم حفظ ${num(data.habits.length)} عادة في الملف`);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setPending(parseBackup(await file.text()));
    } catch (e) {
      toast.error(e instanceof BackupError ? e.message : "تعذّر قراءة الملف");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const confirmImport = async () => {
    if (!pending) return;
    await importBackup(pending);
    toast.success(`تم استرجاع ${num(pending.habits.length)} عادة`);
    setPending(null);
  };

  const onPersist = async () => {
    const ok = await requestPersistentStorage();
    setPersisted(ok);
    if (ok) toast.success("تمام، المتصفح هيحافظ على بياناتك");
    else toast.message("المتصفح رفض الطلب حاليًا — احتفظ بنسخة احتياطية للأمان");
  };

  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 pb-16 pt-8">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        رجوع
      </Link>
      <h1 className="mt-3 text-3xl font-bold">الإعدادات</h1>
      <p className="mt-2 text-muted-foreground">
        ظبّط شكل التطبيق، واحتفظ بنسخة من عاداتك عشان ما تضيعش.
      </p>

      <section className="mt-6 space-y-3 rounded-2xl border p-5">
        <div>
          <h2 className="font-semibold">المظهر</h2>
          <p className="mt-1 text-sm text-muted-foreground">اختار الوضع اللي يريح عينك، أو اتبع إعدادات جهازك.</p>
        </div>
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="اختيار مظهر التطبيق">
          {themeOptions.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={theme === option.value ? "default" : "outline"}
              aria-pressed={theme === option.value}
              className="w-full px-2"
              onClick={() => setTheme(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </section>

      <section className="mt-6 space-y-3 rounded-2xl border p-5">
        <h2 className="font-semibold">نسخة احتياطية</h2>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onExport}>حفظ نسخة</Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            استرجاع من ملف
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="اختر ملف النسخة"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
        </div>
      </section>

      <section className="mt-4 space-y-3 rounded-2xl border p-5">
        <h2 className="font-semibold">حماية التخزين</h2>
        <p className="text-sm text-muted-foreground">
          {persisted
            ? "بياناتك محمية من المسح التلقائي للمتصفح."
            : "اطلب من المتصفح ما يمسحش بياناتك لما المساحة تقل."}
        </p>
        {!persisted && (
          <Button variant="outline" onClick={onPersist}>
            احمِ بياناتي
          </Button>
        )}
      </section>

      <AlertDialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>استبدال بياناتك الحالية؟</AlertDialogTitle>
            <AlertDialogDescription>
              الملف فيه {num(pending?.habits.length ?? 0)} عادة و{num(pending?.logs.length ?? 0)}{" "}
              تسجيل. البيانات الموجودة دلوقتي هتتشال وتتحط مكانها.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmImport()}>استرجاع</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

import { createFileRoute } from "@tanstack/react-router";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/app-sidebar";
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
import { type ThemePreference, useTheme } from "@/lib/theme/theme-context";

const themeOptions: readonly { value: ThemePreference; label: string }[] = [
  { value: "system", label: "حسب الجهاز" },
  { value: "light", label: "نهاري" },
  { value: "dark", label: "ليلي" },
];

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "عادة — الإعدادات" },
      { name: "description", content: "اختار مظهر التطبيق واحتفظ بنسخة احتياطية من عاداتك." },
      { property: "og:title", content: "عادة — الإعدادات" },
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
  const [busy, setBusy] = useState(false);
  const [saveFirst, setSaveFirst] = useState(true);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    void navigator.storage
      ?.persisted?.()
      .then(setPersisted)
      .catch(() => setPersisted(null));
  }, []);

  const downloadBackup = async () => {
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

  const onExport = async () => {
    setBusy(true);
    try {
      await downloadBackup();
    } catch {
      toast.error("تعذّر حفظ النسخة، بياناتك الحالية لم تتغيّر");
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      setPending(parseBackup(await file.text()));
      setSaveFirst(true);
    } catch (e) {
      toast.error(e instanceof BackupError ? e.message : "تعذّر قراءة الملف");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const confirmImport = async () => {
    if (!pending || busy) return;
    setBusy(true);
    try {
      if (saveFirst) await downloadBackup();
      await importBackup(pending);
      toast.success(`تم استرجاع ${num(pending.habits.length)} عادة`);
      setPending(null);
    } catch {
      toast.error("تعذّر الاسترجاع، بياناتك الحالية لم تتغيّر. حاول مرة أخرى");
    } finally {
      setBusy(false);
    }
  };

  const onPersist = async () => {
    try {
      const ok = await requestPersistentStorage();
      setPersisted(ok);
      if (ok) toast.success("تمام، المتصفح هيحافظ على بياناتك");
      else toast.message("المتصفح رفض الطلب حاليًا — احتفظ بنسخة احتياطية للأمان");
    } catch {
      toast.error("تعذّر حماية التخزين، احتفظ بنسخة احتياطية للأمان");
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 pb-16 pt-8">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">الإعدادات</h1>
          <p className="mt-2 text-muted-foreground">ظبّط شكل التطبيق، واحتفظ بنسخة من عاداتك عشان ما تضيعش.</p>
        </div>
        <AppSidebar />
      </header>

      <section className="mt-6 space-y-3 rounded-2xl border p-5">
        <div>
          <h2 className="font-semibold">المظهر</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            اختار الوضع اللي يريح عينك، أو اتبع إعدادات جهازك.
          </p>
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
          <Button disabled={busy} onClick={() => void onExport()}>
            حفظ نسخة
          </Button>
          <Button disabled={busy} variant="outline" onClick={() => fileRef.current?.click()}>
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

      <AlertDialog open={pending !== null} onOpenChange={(o) => !o && !busy && setPending(null)}>
        <AlertDialogContent dir="rtl" className="max-w-[min(32rem,calc(100%-2rem))] rounded-lg">
          <AlertDialogHeader className="text-start sm:text-start">
            <AlertDialogTitle>استبدال بياناتك الحالية؟</AlertDialogTitle>
            <AlertDialogDescription>
              الملف فيه {num(pending?.habits.length ?? 0)} عادة و{num(pending?.logs.length ?? 0)}{" "}
              تسجيل. البيانات الموجودة دلوقتي هتتشال وتتحط مكانها.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={saveFirst}
              disabled={busy}
              onChange={(e) => setSaveFirst(e.target.checked)}
              className="mt-1 size-4 shrink-0 accent-primary"
            />
            حفظ نسخة من بياناتي الحالية قبل الاستبدال
          </label>
          <AlertDialogFooter className="gap-2 sm:space-x-0">
            <AlertDialogCancel disabled={busy}>إلغاء</AlertDialogCancel>
            <Button disabled={busy} onClick={() => void confirmImport()}>
              {busy ? "جارٍ الاسترجاع…" : "استرجاع"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

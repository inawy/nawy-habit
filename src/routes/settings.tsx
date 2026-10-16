import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Download, ShieldCheck, Upload } from "lucide-react";
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

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "بياناتك — ناوي للعادات" },
      { name: "description", content: "صدّر نسخة من عاداتك أو استرجعها، وبياناتك تبقى على جهازك." },
      { property: "og:title", content: "بياناتك — ناوي للعادات" },
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
    a.click();
    URL.revokeObjectURL(url);
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
        <ArrowRight className="size-4" /> رجوع
      </Link>
      <h1 className="mt-3 text-3xl font-bold">بياناتك</h1>
      <p className="mt-2 text-muted-foreground">
        كل عاداتك محفوظة على جهازك بس. خُد نسخة من وقت للتاني عشان ما تضيعش.
      </p>

      <section className="mt-6 space-y-3 rounded-2xl border p-5">
        <h2 className="font-semibold">نسخة احتياطية</h2>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onExport}>
            <Download /> حفظ نسخة
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload /> استرجاع من ملف
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
            <ShieldCheck /> احمِ بياناتي
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

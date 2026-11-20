import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { BUILD_INFO } from "@/lib/build-info";
import { num } from "@/lib/format/numbers";
import { isNativeApp } from "@/lib/native/platform";
import { getReminderScheduler, type NativePermission } from "@/lib/native/reminder-scheduler";
import { MAX_REMINDERS_PER_DAY } from "@/lib/reminders/slots";

/** A button must always answer: if the phone says nothing, say so instead of staying silent. */
const PHONE_TIMEOUT_MS = 10_000;

function withTimeout<T>(work: Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(
      () => reject(new Error("الهاتف لم يردّ خلال 10 ثوانٍ")),
      PHONE_TIMEOUT_MS,
    );
    work.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

const permissionLabel: Record<NativePermission, string> = {
  granted: "مسموح",
  denied: "مرفوض",
  default: "لم يُحدَّد بعد",
};

/**
 * Settings card for the Android app only: shows what the phone actually holds, and lets the person
 * send a test notification. It reads the phone directly, so it reports facts, not hopes.
 * The data-* attributes are read by tools/android/emulator_test.mjs.
 */
export function ReminderDiagnostics() {
  const [native, setNative] = useState(false);
  const [permission, setPermission] = useState<NativePermission | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      const scheduler = getReminderScheduler();
      setPermission(await withTimeout(scheduler.checkPermission()));
      setPending(await withTimeout(scheduler.pendingCount()));
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const inApp = isNativeApp();
    setNative(inApp);
    if (inApp) void refresh();
  }, [refresh]);

  const allowNotifications = async () => {
    setBusy(true);
    try {
      setPermission(await withTimeout(getReminderScheduler().requestPermission()));
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    setBusy(true);
    try {
      await withTimeout(getReminderScheduler().showTest());
      setMessage("اتبعت إشعار تجريبي. لو ما ظهرش، راجع إعدادات الإشعارات للتطبيق.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  if (!native) return null;

  return (
    <section
      className="mt-4 space-y-3 rounded-2xl border p-5"
      data-testid="reminder-diag"
      data-permission={permission ?? "unknown"}
      data-pending={pending === null ? "" : String(pending)}
      data-build={BUILD_INFO.sha}
    >
      <div>
        <h2 className="font-semibold">فحص التذكيرات</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          التذكير اليومي بمواعيد ثابتة، حتى {num(MAX_REMINDERS_PER_DAY)} مرات في اليوم. هنا بتشوف
          اللي الهاتف مجدوله فعلًا.
        </p>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted-foreground">إذن الإشعارات</dt>
        <dd>{permission ? permissionLabel[permission] : "…"}</dd>
        <dt className="text-muted-foreground">التذكيرات المجدولة</dt>
        <dd>{pending === null ? "…" : num(pending)}</dd>
        <dt className="text-muted-foreground">رقم النسخة</dt>
        <dd dir="ltr" className="text-start">
          {BUILD_INFO.sha}
        </dd>
      </dl>
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {permission !== "granted" && (
          <Button disabled={busy} onClick={() => void allowNotifications()}>
            السماح بالإشعارات
          </Button>
        )}
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => void refresh()}
          data-testid="reminder-check"
        >
          فحص
        </Button>
        <Button
          variant="outline"
          disabled={busy || permission !== "granted"}
          onClick={() => void sendTest()}
          data-testid="reminder-test"
        >
          إشعار تجريبي
        </Button>
      </div>
    </section>
  );
}

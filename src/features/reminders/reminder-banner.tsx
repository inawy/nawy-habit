import { Icon } from "@/components/icon";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { isDismissedToday, recordDismissed } from "@/lib/reminders/reminders-store";

import { useReminders } from "./use-reminders";

interface Props {
  today: string;
  unfinished: number;
}

/** Compact reminder opt-in; the fixed schedule runs only while the app is open. */
export function ReminderBanner({ today, unfinished }: Props) {
  const { permission, request } = useReminders(today, unfinished);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(isDismissedToday(today));
  }, [today]);

  if (permission !== "default" || dismissed) return null;

  return (
    <section
      className="mb-3 flex items-center gap-2 rounded-xl border bg-card px-3 py-2"
      aria-label="تشغيل التذكير اليومي"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary" aria-hidden>
        <Icon name="notifications" className="size-4 text-accent-foreground" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-semibold">فكّرنا نذكّرك</h2>
        <p className="text-xs leading-5 text-muted-foreground">
          حتى 3 تنبيهات يومية أثناء تشغيل التطبيق
        </p>
      </div>
      <Button size="sm" className="h-8 shrink-0 px-3" onClick={() => void request()}>
        تفعيل
      </Button>
      <button
        type="button"
        onClick={() => {
          recordDismissed(today);
          setDismissed(true);
        }}
        aria-label="إخفاء بطاقة التذكير للنهاردة"
        className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
      >
        <span aria-hidden className="text-xl leading-none">
          ×
        </span>
      </button>
    </section>
  );
}

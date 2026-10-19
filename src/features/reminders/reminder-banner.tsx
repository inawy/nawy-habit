import { Bell, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { isDismissedToday, recordDismissed } from "@/lib/reminders/reminders-store";

import { useReminders } from "./use-reminders";

interface Props {
  today: string;
  unfinished: number;
}

/**
 * Enable card for the daily reminder. Honest by design: fixed times,
 * max 3 per day, works only while the app is open — never implies
 * the user can configure a custom time.
 */
export function ReminderBanner({ today, unfinished }: Props) {
  const { permission, request } = useReminders(today, unfinished);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(isDismissedToday(today));
  }, [today]);

  if (permission !== "default" || dismissed) return null;

  return (
    <section
      className="mb-4 rounded-2xl border bg-card p-4 shadow-sm"
      aria-label="تشغيل التذكير اليومي"
    >
      <div className="flex items-start gap-3">
        <span
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary"
          aria-hidden
        >
          <Bell className="size-5 text-accent-foreground" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">فكّرنا نذكّرك 🌿</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            تنبيهات يومية بسيطة: لحد 3 مرات في اليوم في أوقات ثابتة، لما يكون التطبيق مفتوح أو شغال
            بالخلفية. الأوقات ثابتة ومش بتتظبط.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            recordDismissed(today);
            setDismissed(true);
          }}
          aria-label="إخفاء بطاقة التذكير للنهاردة"
          className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
        >
          <X className="size-4" />
        </button>
      </div>
      <Button className="mt-3 w-full" onClick={() => void request()}>
        <Bell /> شغّل التذكير
      </Button>
    </section>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Icon } from "@/components/icon";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { HabitFormDialog } from "@/features/habits/habit-form-dialog";
import { HabitRow } from "@/features/habits/habit-row";
import { useHabitsView, useToday } from "@/features/habits/use-habits";
import { ReminderBanner } from "@/features/reminders/reminder-banner";
import { lastDays, parseDayKey } from "@/lib/date/day-key";
import { arabicFmt, num } from "@/lib/format/numbers";
import type { Habit } from "@/lib/db/schema";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "اليوم — ناوي للعادات" },
      {
        name: "description",
        content: "سجّل عاداتك اليومية بضغطة واحدة، وبياناتك محفوظة على جهازك.",
      },
      { property: "og:title", content: "ناوي للعادات" },
      {
        property: "og:description",
        content: "متتبع عادات هادئ يعمل بدون إنترنت ويحفظ بياناتك على جهازك.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TodayPage,
});

const dateFmt = arabicFmt({ weekday: "long", day: "numeric", month: "long" });
const weekdayFmt = arabicFmt({ weekday: "short" });
const dayNumberFmt = arabicFmt({ day: "numeric" });
const dateRangeFmt = arabicFmt({ day: "numeric", month: "short" });

function TodayPage() {
  const today = useToday();
  const view = useHabitsView();
  const recentDays = today ? lastDays(today, 5) : [];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (h: Habit) => {
    setEditing(h);
    setDialogOpen(true);
  };

  const doneCount =
    today && view ? view.habits.filter((h) => view.daysByHabit.get(h.id)?.has(today)).length : 0;

  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 pb-36 pt-6">
      <header className="mb-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {today ? dateFmt.format(parseDayKey(today)) : "\u00a0"}
          </p>
          <Link
            to="/settings"
            aria-label="الإعدادات"
            className="rounded-full p-2 text-muted-foreground hover:bg-muted"
          >
            <Icon name="settings" className="size-5" />
          </Link>
        </div>
        <h1 className="mt-1 text-3xl font-bold">اليوم</h1>
        {view && view.habits.length > 0 && (
          <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
            أنجزت {num(doneCount)} من {num(view.habits.length)}
          </p>
        )}
      </header>

      {view && today && view.habits.length > 0 && (
        <ReminderBanner today={today} unfinished={view.habits.length - doneCount} />
      )}

      {!view || !today ? (
        <div className="space-y-3" aria-busy>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : view.habits.length === 0 ? (
        <section className="rounded-2xl border border-dashed p-10 text-center">
          <span
            className="mx-auto grid size-12 place-items-center rounded-full bg-accent"
            aria-hidden
          >
            <span className="size-3 rounded-full bg-primary" />
          </span>
          <h2 className="mt-3 text-lg font-semibold">ابدأ بعادة واحدة</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            صغيرة وسهلة، والاستمرار أهم من الكمال.
          </p>
          <Button className="mt-5" onClick={openNew}>
            <Icon name="add" className="size-5" />
            أضف عادة
          </Button>
        </section>
      ) : (
        <section
          className="overflow-hidden rounded-xl border bg-card"
          aria-label="عاداتك خلال آخر خمسة أيام"
        >
          <div className="flex items-center justify-between gap-3 px-3 pb-2 pt-3">
            <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              آخر {num(5)} أيام
            </span>
            <span className="text-[11px] text-muted-foreground">
              {dateRangeFmt.format(parseDayKey(recentDays[0] ?? today))}{" — "}
              {dateRangeFmt.format(parseDayKey(today))}
            </span>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_repeat(5,1.75rem)] items-center gap-x-1.5 border-b bg-muted/30 px-3 py-2">
            <span className="min-w-0 text-[10px] font-medium text-muted-foreground">العادة</span>
            {recentDays.map((day) => (
              <span key={day} className="flex min-w-0 flex-col items-center gap-0.5 text-center">
                <span className="text-[9px] leading-none text-muted-foreground">
                  {weekdayFmt.format(parseDayKey(day))}
                </span>
                <span className={
                    day === today
                      ? "text-[11px] font-bold text-primary"
                      : "text-[11px] text-foreground"
                  }>
                  {dayNumberFmt.format(parseDayKey(day))}
                </span>
              </span>
            ))}
          </div>
          <ul className="divide-y divide-border">
            {view.habits.map((h) => (
              <HabitRow
                key={h.id}
                habit={h}
                days={view.daysByHabit.get(h.id) ?? new Set()}
                recentDays={recentDays}
                today={today}
                onEdit={openEdit}
              />
            ))}
          </ul>
        </section>
      )}

      {view && view.habits.length > 0 && (
        <button
          type="button"
          onClick={openNew}
          aria-label="إضافة عادة جديدة"
          title="إضافة عادة جديدة"
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] end-5 z-40 grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:bg-primary-pressed active:scale-95"
        >
          <Icon name="add" className="size-6" />
        </button>
      )}

      <HabitFormDialog open={dialogOpen} onOpenChange={setDialogOpen} habit={editing} />
    </main>
  );
}

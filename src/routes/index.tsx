import { createFileRoute, Link } from "@tanstack/react-router";
import { Icon } from "@/components/icon";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { HabitMonthOverview } from "@/features/habits/habit-month-overview";
import { HabitFormDialog } from "@/features/habits/habit-form-dialog";
import { InstallAppButton } from "@/features/pwa/install-app-button";
import { useHabitsView, useToday } from "@/features/habits/use-habits";
import { ReminderBanner } from "@/features/reminders/reminder-banner";
import { parseDayKey } from "@/lib/date/day-key";
import { arabicFmt, num } from "@/lib/format/numbers";

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
        name: "og:description",
        content: "متتبع عادات هادئ يعمل بدون إنترنت ويحفظ بياناتك على جهازك.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TodayPage,
});

const dateFmt = arabicFmt({ weekday: "long", day: "numeric", month: "long" });

function TodayPage() {
  const today = useToday();
  const view = useHabitsView();
  const [dialogOpen, setDialogOpen] = useState(false);

  const openNew = () => setDialogOpen(true);
  const doneCount =
    today && view
      ? view.habits.filter((habit) => view.daysByHabit.get(habit.id)?.has(today)).length
      : 0;
  const totalCount = view?.habits.length ?? 0;

  return (
    <main className="mx-auto min-h-[100dvh] max-w-2xl px-4 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] pt-5 sm:px-5">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0 pt-0.5">
          <h1 className="text-[1.85rem] font-bold leading-tight tracking-tight">اليوم</h1>
          <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Icon name="calendar_month" className="size-4" />
            {today ? (
              <time dateTime={today} className="truncate">
                {dateFmt.format(parseDayKey(today))}
              </time>
            ) : (
              "\u00a0"
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-1">
          <InstallAppButton />
          <Link
            to="/settings"
            aria-label="الإعدادات"
            title="الإعدادات"
            className="habit-toolbar-action grid size-10 place-items-center rounded-full border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Icon name="settings" className="size-5" />
          </Link>
        </div>
      </header>

      {view && today && totalCount > 0 && (
        <ReminderBanner today={today} unfinished={totalCount - doneCount} />
      )}

      {!view || !today ? (
        <div className="space-y-3" aria-busy>
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-16 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : totalCount === 0 ? (
        <section className="rounded-[1.5rem] border border-dashed bg-card px-6 py-12 text-center">
          <span
            className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent"
            aria-hidden
          >
            <span className="size-3 rounded-full bg-primary" />
          </span>
          <h2 className="mt-4 text-lg font-bold">ابدأ بعادة واحدة</h2>
          <p className="mx-auto mt-1 max-w-xs text-sm leading-6 text-muted-foreground">
            اختار حاجة صغيرة نفسك تواظب عليها، وسجّل إنجازك يومًا بيوم.
          </p>
          <Button className="mt-6 rounded-full px-5" onClick={openNew}>
            <Icon name="add" className="size-5" />
            أضف أول عادة
          </Button>
        </section>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-base font-bold">عاداتك</h2>
            <span className="rounded-full border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {num(totalCount)} عادة
            </span>
          </div>
          <HabitMonthOverview
            habits={view.habits}
            daysByHabit={view.daysByHabit}
            today={today}
          />
        </>
      )}

      {view && totalCount > 0 && (
        <Button
          type="button"
          onClick={openNew}
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] end-4 z-40 h-14 rounded-full px-5 text-base font-semibold shadow-xl shadow-primary/20 transition-transform active:scale-[0.98] sm:end-6"
        >
          <Icon name="add" className="size-6" />
          إضافة عادة
        </Button>
      )}

      <HabitFormDialog open={dialogOpen} onOpenChange={setDialogOpen} habit={null} />
    </main>
  );
}

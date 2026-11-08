import { createFileRoute, Link } from "@tanstack/react-router";
import { Icon } from "@/components/icon";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  HabitOverview,
  HabitViewCycleButton,
  type OverviewMode,
} from "@/features/habits/habit-overview";
import { HabitFormDialog } from "@/features/habits/habit-form-dialog";
import { InstallAppButton } from "@/features/pwa/install-app-button";
import { useHabitsView, useToday } from "@/features/habits/use-habits";
import { ReminderBanner } from "@/features/reminders/reminder-banner";
import { lastDays, parseDayKey } from "@/lib/date/day-key";
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
const OVERVIEW_MODE_KEY = "nawy-habit-overview-mode";

function isOverviewMode(value: string | null): value is OverviewMode {
  return value === "cards" || value === "checklist" || value === "compact";
}

function TodayPage() {
  const today = useToday();
  const view = useHabitsView();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [overviewMode, setOverviewMode] = useState<OverviewMode>("compact");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(OVERVIEW_MODE_KEY);
      if (isOverviewMode(saved)) setOverviewMode(saved);
    } catch {
      // Keep compact mode when local preferences are unavailable.
    }
  }, []);

  const chooseOverviewMode = (mode: OverviewMode) => {
    setOverviewMode(mode);
    try {
      window.localStorage.setItem(OVERVIEW_MODE_KEY, mode);
    } catch {
      // The selected mode remains active for this page session.
    }
  };

  const openNew = () => setDialogOpen(true);
  const doneCount =
    today && view
      ? view.habits.filter((habit) => view.daysByHabit.get(habit.id)?.has(today)).length
      : 0;
  const totalCount = view?.habits.length ?? 0;
  const recentDays = today ? lastDays(today, 5) : [];

  return (
    <main className="mx-auto min-h-[100dvh] max-w-2xl px-4 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] pt-5 sm:px-5">
      <header className="mb-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-muted-foreground">
            {today ? dateFmt.format(parseDayKey(today)) : "\u00a0"}
          </p>
          <div className="flex items-center gap-2">
            {view && totalCount > 0 && (
              <HabitViewCycleButton value={overviewMode} onChange={chooseOverviewMode} />
            )}
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
        </div>
        <div className="mt-3 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[1.85rem] font-bold leading-tight tracking-tight">اليوم</h1>
          </div>
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
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold">عاداتك</h2>
            <span className="text-[11px] text-muted-foreground">{num(totalCount)} عادة</span>
          </div>
          <HabitOverview
            mode={overviewMode}
            habits={view.habits}
            daysByHabit={view.daysByHabit}
            recentDays={recentDays}
            today={today}
          />
        </>
      )}

      {view && totalCount > 0 && (
        <>
          <Button
            type="button"
            onClick={openNew}
            size="icon"
            aria-label="إضافة عادة"
            title="إضافة عادة"
            className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] end-4 z-40 size-14 rounded-full p-0 shadow-xl transition-transform active:scale-[0.98] sm:end-6"
          >
            <Icon name="add" className="size-7" />
          </Button>
        </>
      )}

      <HabitFormDialog open={dialogOpen} onOpenChange={setDialogOpen} habit={null} />
    </main>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Flame, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { HabitCalendar } from "@/features/habits/habit-calendar";
import { HabitActivityGrid } from "@/features/habits/habit-activity-grid";
import { HabitFormDialog } from "@/features/habits/habit-form-dialog";
import { useHabitDetailView } from "@/features/habits/use-habit-detail";
import { useToday } from "@/features/habits/use-habits";
import { parseDayKey, type DayKey } from "@/lib/date/day-key";
import { toMonthKey, type MonthKey } from "@/lib/date/month";
import { archiveHabit, restoreHabit, toggleLog } from "@/lib/db/habits-repo";
import { arabicFmt, num } from "@/lib/format/numbers";
import { lastWeeks, monthProgress } from "@/lib/habits/consistency";
import { computeStreaks } from "@/lib/habits/streak";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/habit/$habitId")({
  head: () => ({
    meta: [
      { title: "تفاصيل العادة — ناوي للعادات" },
      {
        name: "description",
        content: "تقويم شهري ونسبة التزام لكل عادة، محفوظة على جهازك.",
      },
      { property: "og:title", content: "تفاصيل العادة — ناوي للعادات" },
      {
        property: "og:description",
        content: "شوف أيامك اللي التزمت فيها، ونسبة التزامك هذا الشهر.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HabitDetailPage,
});

const weekLabelFmt = arabicFmt({ day: "numeric", month: "short" });

function HabitDetailPage() {
  const { habitId } = Route.useParams();
  const today = useToday();
  const view = useHabitDetailView(habitId);
  const [pickedMonth, setPickedMonth] = useState<MonthKey | null>(null);
  const [editing, setEditing] = useState(false);

  const month = pickedMonth ?? (today ? toMonthKey(today) : null);

  if (!today || view === undefined || !month) {
    return (
      <main className="mx-auto min-h-screen max-w-xl px-4 pb-28 pt-8">
        <div className="h-9 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="mt-6 h-28 animate-pulse rounded-2xl bg-muted" />
        <div className="mt-4 h-72 animate-pulse rounded-2xl bg-muted" />
      </main>
    );
  }

  if (view === null) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 text-center">
        <p className="text-4xl" aria-hidden>
          🔍
        </p>
        <h1 className="mt-3 text-lg font-semibold">ما لقينا هذه العادة</h1>
        <p className="mt-1 text-sm text-muted-foreground">يمكن اتحذفت، أو الرابط مش مظبوط.</p>
        <Button asChild className="mt-5">
          <Link to="/">ارجع لليوم</Link>
        </Button>
      </main>
    );
  }

  const { habit, days } = view;
  const streaks = computeStreaks(days, today);
  const progress = monthProgress(days, month, today);
  const weeks = lastWeeks(days, today, 4);
  const percent = progress.rate === null ? null : Math.round(progress.rate * 100);

  async function onToggleDay(day: DayKey) {
    try {
      await toggleLog(habit.id, day);
    } catch (err) {
      console.error(err);
      toast.error("تعذّر التسجيل");
    }
  }

  async function onArchive() {
    await archiveHabit(habit.id);
    toast(`أُرشفت «${habit.name}»`, {
      action: { label: "تراجع", onClick: () => void restoreHabit(habit.id) },
    });
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 pb-28 pt-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
      >
        <ArrowRight className="size-4" aria-hidden />
        رجوع
      </Link>

      <header className="mt-4 flex items-start gap-3">
        <span
          className="grid size-14 shrink-0 place-items-center rounded-2xl bg-secondary text-3xl"
          aria-hidden
        >
          {habit.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold">{habit.name}</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <Flame className="size-4 text-accent-foreground" aria-hidden />
            {streaks.current > 0 ? `${num(streaks.current)} يوم متتالي` : "ابدأ اليوم"}
            {streaks.best > 1 && <span className="ms-2">· الأفضل {num(streaks.best)}</span>}
            <span className="ms-2">· الإجمالي {num(streaks.total)}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="تعديل العادة"
          className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
        >
          <Pencil className="size-4" />
        </button>
      </header>

      {habit.archivedAt && (
        <p className="mt-4 rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
          هذه العادة مؤرشفة.{" "}
          <button
            type="button"
            onClick={() => void restoreHabit(habit.id)}
            className="font-medium text-primary underline underline-offset-2"
          >
            استعادتها
          </button>
        </p>
      )}

      <section className="mt-5 rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium text-muted-foreground">الالتزام هذا الشهر</h2>
            <p className="mt-1 text-3xl font-bold tabular-nums">
              {percent === null ? "—" : `${num(percent)}٪`}
            </p>
          </div>
          {progress.elapsed > 0 && (
            <p className="pb-1 text-sm text-muted-foreground">
              {num(progress.done)} من {num(progress.elapsed)} يوم
            </p>
          )}
        </div>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent ?? 0}
          aria-label="نسبة الالتزام هذا الشهر"
        >
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${percent ?? 0}%` }}
          />
        </div>
      </section>

      <div className="mt-4">
        <HabitCalendar
          month={month}
          days={days}
          today={today}
          onMonthChange={setPickedMonth}
          onToggle={(d) => void onToggleDay(d)}
        />
      </div>

      <section className="mt-6" aria-label="سجل الإنجاز">
        <h2 className="text-sm font-medium">سجل الإنجاز</h2>
        <HabitActivityGrid days={days} today={today} />
      </section>

      <section className="mt-4 rounded-2xl border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-medium text-muted-foreground">آخر 4 أسابيع</h2>
        <ol className="mt-3 grid grid-cols-4 gap-2">
          {weeks.map((w) => (
            <li key={w.weekStart} className="text-center">
              <div className="flex flex-col-reverse gap-1">
                {w.days.map((d) => (
                  <span
                    key={d}
                    className={cn(
                      "h-2 w-full rounded-full",
                      days.has(d) ? "bg-primary" : "bg-muted",
                    )}
                  />
                ))}
              </div>
              <span className="mt-2 block text-[11px] text-muted-foreground">
                {weekLabelFmt.format(parseDayKey(w.weekStart))}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-6">
        <Button variant="ghost" onClick={() => void onArchive()}>
          أرشفة العادة
        </Button>
      </div>

      <HabitFormDialog open={editing} onOpenChange={setEditing} habit={habit} />
    </main>
  );
}

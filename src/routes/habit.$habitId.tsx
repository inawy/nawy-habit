import { createFileRoute, Link } from "@tanstack/react-router";
import { Icon } from "@/components/icon";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { HabitCalendar } from "@/features/habits/habit-calendar";
import { HabitActivityGrid } from "@/features/habits/habit-activity-grid";
import { HabitFormDialog } from "@/features/habits/habit-form-dialog";
import { useHabitDetailView } from "@/features/habits/use-habit-detail";
import { useToday } from "@/features/habits/use-habits";
import { parseDayKey, toDayKey, type DayKey } from "@/lib/date/day-key";
import { toMonthKey, type MonthKey } from "@/lib/date/month";
import { archiveHabit, restoreHabit, toggleLog } from "@/lib/db/habits-repo";
import { arabicFmt, num } from "@/lib/format/numbers";
import { monthProgress } from "@/lib/habits/consistency";
import { computeStreaks } from "@/lib/habits/streak";

export const Route = createFileRoute("/habit/$habitId")({
  head: () => ({
    meta: [
      { title: "تفاصيل العادة — ناوي للعادات" },
      {
        name: "description",
        content: "سجل الإنجاز ونسبة الالتزام، مع إمكانية تعديل الأيام السابقة.",
      },
      { property: "og:title", content: "تفاصيل العادة — ناوي للعادات" },
      {
        property: "og:description",
        content: "شوف سجل إنجازك ونسبة التزامك، وعدّل أي يوم سابق.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HabitDetailPage,
});

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
  const percent = progress.rate === null ? null : Math.round(progress.rate * 100);
  const monthLabel = arabicFmt({ month: "long", year: "numeric" }).format(
    parseDayKey(month + "-01"),
  );
  const currentMonth = toMonthKey(today);
  const habitStartDay = toDayKey(new Date(habit.createdAt));
  const oldestLogDay = Array.from(days).sort()[0] ?? habitStartDay;
  const historyStartDay =
    habitStartDay < oldestLogDay ? habitStartDay : oldestLogDay;
  const minMonth = toMonthKey(historyStartDay);

  async function onToggleDay(day: DayKey) {
    try {
      await toggleLog(habit.id, day);
    } catch (error) {
      console.error(error);
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
    <main className="mx-auto min-h-screen max-w-xl px-4 pb-28 pt-5">
      <div className="flex items-center justify-between">
        <Link
          to="/"
          aria-label="العودة للعادات"
          title="العودة للعادات"
          className="habit-toolbar-action grid size-10 place-items-center rounded-full border bg-card text-muted-foreground transition-colors hover:bg-muted"
        >
          <Icon name="chevron_right" className="size-5" />
        </Link>
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="تعديل العادة"
          className="habit-toolbar-action grid size-10 place-items-center rounded-full border bg-card text-muted-foreground transition-colors hover:bg-muted"
        >
          <Icon name="more_horiz" className="size-5" />
        </button>
      </div>

      <header className="mt-5 flex items-center gap-3">
        <span
          className="habit-identity grid size-14 shrink-0 place-items-center rounded-2xl"
          data-habit-color={habit.color}
        >
          <Icon name={habit.icon} className="size-7" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[1.6rem] font-bold leading-tight">{habit.name}</h1>
          <p className="mt-1 text-xs text-muted-foreground">سجلّك الخاص مع العادة دي</p>
        </div>
      </header>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="إحصاءات العادة">
        <span className="habit-stat-chip" data-habit-color={habit.color}>
          <Icon name="local_fire_department" className="size-4" />
          <span>{num(streaks.current)} متتالي</span>
        </span>
        <span className="habit-stat-chip">
          <span className="font-semibold">{num(streaks.best)}</span>
          <span>أفضل سلسلة</span>
        </span>
        <span className="habit-stat-chip">
          <span className="font-semibold">{num(streaks.total)}</span>
          <span>يوم إنجاز</span>
        </span>
      </div>

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

      <section
        className="habit-history-panel mt-5 rounded-[1.4rem] border p-4"
        data-habit-color={habit.color}
        aria-label="سجل العادة بالكامل"
      >
        <HabitActivityGrid
          days={days}
          today={today}
          color={habit.color}
          startDate={historyStartDay}
        />
      </section>

      <section className="mt-4" aria-label="التقويم الشهري وتعديل السجل السابق">
        <HabitCalendar
          month={month}
          minMonth={minMonth}
          days={days}
          today={today}
          onMonthChange={setPickedMonth}
          onToggle={(day) => void onToggleDay(day)}
        />
      </section>

      <section
        className="habit-progress-card mt-5 rounded-[1.4rem] border bg-card p-4"
        data-habit-color={habit.color}
      >
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xs font-medium text-muted-foreground">
              {month === currentMonth ? "الالتزام هذا الشهر" : "الالتزام في " + monthLabel}
            </h2>
            <p className="mt-1 text-3xl font-bold tabular-nums">
              {percent === null ? "—" : `${num(percent)}٪`}
            </p>
          </div>
          {progress.elapsed > 0 && (
            <p className="pb-1 text-xs text-muted-foreground">
              {num(progress.done)} من {num(progress.elapsed)} يوم
            </p>
          )}
        </div>
        <div
          className="habit-progress-track mt-3 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent ?? 0}
          aria-label="نسبة الالتزام هذا الشهر"
        >
          <div
            className="habit-progress-fill h-full rounded-full transition-[width] duration-300"
            style={{ width: `${percent ?? 0}%` }}
          />
        </div>
      </section>

      <div className="mt-6 flex justify-end">
        <Button variant="ghost" onClick={() => void onArchive()}>
          أرشفة العادة
        </Button>
      </div>

      <HabitFormDialog open={editing} onOpenChange={setEditing} habit={habit} />
    </main>
  );
}

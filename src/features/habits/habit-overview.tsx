import { Link } from "@tanstack/react-router";
import { Icon, type IconName } from "@/components/icon";
import { toast } from "sonner";

import { HabitActivityGrid } from "@/features/habits/habit-activity-grid";
import { HabitRow } from "@/features/habits/habit-row";
import type { DayKey } from "@/lib/date/day-key";
import { parseDayKey } from "@/lib/date/day-key";
import { toggleLog } from "@/lib/db/habits-repo";
import type { Habit } from "@/lib/db/schema";
import { arabicFmt, num } from "@/lib/format/numbers";
import { computeStreaks } from "@/lib/habits/streak";

export type OverviewMode = "cards" | "checklist" | "compact";

interface OverviewProps {
  mode: OverviewMode;
  habits: Habit[];
  daysByHabit: Map<string, Set<DayKey>>;
  recentDays: DayKey[];
  today: DayKey;
}

const weekdayFmt = arabicFmt({ weekday: "short" });
const dayNumberFmt = arabicFmt({ day: "numeric" });
const dateRangeFmt = arabicFmt({ day: "numeric", month: "short" });

async function toggleToday(habit: Habit, today: DayKey) {
  try {
    const completed = await toggleLog(habit.id, today);
    toast.success(completed ? "اتسجل إنجاز النهارده" : "اتشال تسجيل النهارده", {
      duration: 1400,
    });
  } catch (error) {
    console.error(error);
    toast.error("تعذّر التسجيل");
  }
}

function TodayToggle({
  habit,
  today,
  complete,
}: {
  habit: Habit;
  today: DayKey;
  complete: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => void toggleToday(habit, today)}
      aria-label={complete ? `إلغاء إنجاز ${habit.name} اليوم` : `تسجيل إنجاز ${habit.name} اليوم`}
      aria-pressed={complete}
      data-complete={complete}
      className="habit-today-toggle grid size-10 shrink-0 place-items-center rounded-full border transition-all active:scale-95"
    >
      <Icon name={complete ? "check" : "add"} className="size-5" />
    </button>
  );
}

function HabitChecklistItem({
  habit,
  days,
  today,
}: {
  habit: Habit;
  days: Set<DayKey>;
  today: DayKey;
}) {
  const streak = computeStreaks(days, today).current;
  const complete = days.has(today);

  return (
    <li
      className="habit-checklist-row flex items-center gap-3 px-3 py-3"
      data-habit-color={habit.color}
    >
      <Link
        to="/habit/$habitId"
        params={{ habitId: habit.id }}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg"
      >
        <span
          className="habit-identity grid size-10 shrink-0 place-items-center rounded-xl"
          data-habit-color={habit.color}
        >
          <Icon name={habit.icon} className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{habit.name}</span>
          <span className="mt-0.5 block text-[11px] text-muted-foreground">
            {streak > 0 ? `${num(streak)} يوم متتالي` : "ابدأ بأول إنجاز"}
          </span>
        </span>
      </Link>
      <TodayToggle habit={habit} today={today} complete={complete} />
    </li>
  );
}

function HabitOverviewCard({
  habit,
  days,
  today,
}: {
  habit: Habit;
  days: Set<DayKey>;
  today: DayKey;
}) {
  const streak = computeStreaks(days, today).current;
  const complete = days.has(today);

  return (
    <li
      className="habit-overview-card rounded-[1.35rem] border bg-card p-3.5"
      data-habit-color={habit.color}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Link
          to="/habit/$habitId"
          params={{ habitId: habit.id }}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg"
        >
          <span
            className="habit-identity grid size-10 shrink-0 place-items-center rounded-xl"
            data-habit-color={habit.color}
          >
            <Icon name={habit.icon} className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{habit.name}</span>
            <span className="mt-0.5 block text-[11px] text-muted-foreground">
              {streak > 0 ? `${num(streak)} يوم متتالي` : `${num(days.size)} إنجاز سابق`}
            </span>
          </span>
        </Link>
        <TodayToggle habit={habit} today={today} complete={complete} />
      </div>
      <div className="habit-overview-history mt-3.5 border-t pt-3">
        <HabitActivityGrid days={days} today={today} color={habit.color} compact />
      </div>
    </li>
  );
}

export function HabitOverview({ mode, habits, daysByHabit, recentDays, today }: OverviewProps) {
  if (mode === "cards") {
    return (
      <ul className="grid gap-3">
        {habits.map((habit) => (
          <HabitOverviewCard
            key={habit.id}
            habit={habit}
            days={daysByHabit.get(habit.id) ?? new Set()}
            today={today}
          />
        ))}
      </ul>
    );
  }

  if (mode === "checklist") {
    return (
      <ul className="habit-checklist overflow-hidden rounded-[1.35rem] border bg-card divide-y divide-border">
        {habits.map((habit) => (
          <HabitChecklistItem
            key={habit.id}
            habit={habit}
            days={daysByHabit.get(habit.id) ?? new Set()}
            today={today}
          />
        ))}
      </ul>
    );
  }

  return (
    <section
      className="habit-compact-panel overflow-hidden rounded-[1.35rem] border bg-card shadow-sm"
      aria-label="عاداتك خلال آخر خمسة أيام"
    >
      <div className="flex items-center justify-between gap-3 px-3 pb-2 pt-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          العادة
        </span>
        <span className="text-[10px] tabular-nums tracking-wide text-muted-foreground">
          {dateRangeFmt.format(parseDayKey(recentDays[0] ?? today))}
          {" — "}
          {dateRangeFmt.format(parseDayKey(today))}
        </span>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_repeat(5,2rem)] items-center gap-x-2 border-y bg-muted/30 px-3 py-2">
        <span className="min-w-0 text-[10px] font-medium text-muted-foreground"> </span>
        {recentDays.map((day) => (
          <span key={day} className="flex min-w-0 flex-col items-center gap-0.5 text-center">
            <span className="text-[9px] leading-none text-muted-foreground">
              {weekdayFmt.format(parseDayKey(day))}
            </span>
            <span
              className={
                day === today
                  ? "text-[11px] font-bold text-foreground"
                  : "text-[11px] text-muted-foreground"
              }
            >
              {dayNumberFmt.format(parseDayKey(day))}
            </span>
          </span>
        ))}
      </div>
      <ul className="divide-y divide-border/80">
        {habits.map((habit) => (
          <HabitRow
            key={habit.id}
            habit={habit}
            days={daysByHabit.get(habit.id) ?? new Set()}
            recentDays={recentDays}
            today={today}
          />
        ))}
      </ul>
    </section>
  );
}

const viewOptions: { value: OverviewMode; label: string; icon: IconName }[] = [
  { value: "cards", label: "بطاقات", icon: "grid_view" },
  { value: "checklist", label: "قائمة", icon: "view_list" },
  { value: "compact", label: "مختصر", icon: "view_compact" },
];

export function HabitViewCycleButton({
  value,
  onChange,
}: {
  value: OverviewMode;
  onChange: (mode: OverviewMode) => void;
}) {
  const currentIndex = viewOptions.findIndex((option) => option.value === value);
  const currentOption = viewOptions[currentIndex] ?? viewOptions[0];

  const cycleMode = () => {
    const nextOption = viewOptions[(currentIndex + 1) % viewOptions.length];
    onChange(nextOption.value);
    const message =
      nextOption.value === "cards"
        ? "عرض البطاقات"
        : nextOption.value === "checklist"
          ? "عرض القائمة"
          : "العرض المختصر";
    toast(message, { duration: 1200 });
  };

  return (
    <button
      type="button"
      onClick={cycleMode}
      aria-label={`طريقة العرض الحالية: ${currentOption.label}. اضغط للتغيير`}
      title={`الوضع الحالي: ${currentOption.label} — تغيير طريقة العرض`}
      className="habit-toolbar-action grid size-10 place-items-center rounded-full border bg-card text-accent-foreground transition-colors hover:bg-accent"
    >
      <Icon name={currentOption.icon} className="size-5" />
    </button>
  );
}

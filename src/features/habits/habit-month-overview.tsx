import { useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Icon } from "@/components/icon";
import { toast } from "sonner";

import {
  addMonths,
  firstDayOfMonth,
  monthGrid,
  toMonthKey,
  weekDays,
  type MonthKey,
} from "@/lib/date/month";
import { parseDayKey, toDayKey, type DayKey } from "@/lib/date/day-key";
import { toggleLog } from "@/lib/db/habits-repo";
import type { Habit } from "@/lib/db/schema";
import { arabicFmt, num } from "@/lib/format/numbers";
import { cn } from "@/lib/utils";

interface Props {
  habits: Habit[];
  daysByHabit: Map<string, Set<DayKey>>;
  today: DayKey;
}

const monthLabelFmt = arabicFmt({ month: "long", year: "numeric" });
const weekdayFmt = arabicFmt({ weekday: "short" });
const dayFmt = arabicFmt({ day: "numeric" });
const fullDateFmt = arabicFmt({ weekday: "long", day: "numeric", month: "long" });

function getHabitStartDay(habit: Habit): DayKey {
  const createdAt = new Date(habit.createdAt);
  return Number.isNaN(createdAt.getTime()) ? toDayKey(new Date()) : toDayKey(createdAt);
}

function getMonthOptions(minMonth: MonthKey, currentMonth: MonthKey): MonthKey[] {
  const options: MonthKey[] = [];
  for (let month = minMonth; month <= currentMonth; month = addMonths(month, 1)) {
    options.push(month);
  }
  return options;
}

async function toggleHabitDay(habitId: string, day: DayKey) {
  try {
    await toggleLog(habitId, day);
  } catch (error) {
    console.error(error);
    toast.error("تعذّر التسجيل");
  }
}

function HabitMonthCard({
  habit,
  month,
  today,
  days,
}: {
  habit: Habit;
  month: MonthKey;
  today: DayKey;
  days: Set<DayKey>;
}) {
  const startDay = getHabitStartDay(habit);
  const cells = monthGrid(month);
  const weekdays = weekDays(firstDayOfMonth(month)).map((day) =>
    weekdayFmt.format(parseDayKey(day)),
  );
  const monthDays = cells.filter((day): day is DayKey => day !== null);
  const elapsedDays = monthDays.filter((day) => day >= startDay && day <= today);
  const completedDays = elapsedDays.filter((day) => days.has(day)).length;
  const hasStarted = monthDays.some((day) => day >= startDay);
  const countLabel = hasStarted
    ? `${num(completedDays)} / ${num(elapsedDays.length)}`
    : "لم تبدأ بعد";

  return (
    <li
      className="habit-month-card rounded-[1.35rem] border bg-card p-3.5"
      data-habit-color={habit.color}
    >
      <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
        <Link
          to="/habit/$habitId"
          params={{ habitId: habit.id }}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg"
        >
          <span
            className="habit-identity grid size-10 shrink-0 place-items-center rounded-xl"
            data-habit-color={habit.color}
          >
            <Icon name={habit.icon} className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{habit.name}</span>
            <span className="mt-0.5 block text-[10px] text-muted-foreground">
              عرض التفاصيل والسجل السنوي
            </span>
          </span>
        </Link>
        <span className="shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold tabular-nums text-muted-foreground">
          {countLabel}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1.5" aria-label={`أيام الشهر للعادة ${habit.name}`}>
        {weekdays.map((weekday, index) => (
          <span
            key={index}
            className="pb-1 text-center text-[10px] font-medium text-muted-foreground"
          >
            {weekday}
          </span>
        ))}

        {cells.map((day, index) => {
          if (day === null || day < startDay) {
            return (
              <span key={`empty-${index}`} aria-hidden="true" className="habit-month-day-empty" />
            );
          }

          const complete = days.has(day);
          const isToday = day === today;
          const isFuture = day > today;
          const dateLabel = fullDateFmt.format(parseDayKey(day));
          const label = `${dateLabel} — ${complete ? "تم الإنجاز" : isFuture ? "لم يأتِ بعد" : "لم يتم"}${isToday ? " — اليوم" : ""}`;

          return (
            <button
              key={day}
              type="button"
              onClick={() => void toggleHabitDay(habit.id, day)}
              disabled={isFuture}
              aria-label={label}
              aria-pressed={complete}
              title={label}
              data-complete={complete}
              data-today={isToday}
              className={cn(
                "habit-month-day grid aspect-square min-w-0 place-items-center rounded-lg border text-[11px] font-medium tabular-nums transition-colors",
                complete && "is-complete",
                isToday && "is-today",
                isFuture && "is-future",
              )}
            >
              {dayFmt.format(parseDayKey(day))}
            </button>
          );
        })}
      </div>

      {!hasStarted && (
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          لم تكن العادة قد أُضيفت في هذا الشهر
        </p>
      )}
    </li>
  );
}

/** Shared monthly view for all active habits, with RTL-aware swipe navigation. */
export function HabitMonthOverview({ habits, daysByHabit, today }: Props) {
  const currentMonth = toMonthKey(today);
  const oldestStartDay = habits.map(getHabitStartDay).sort()[0] ?? today;
  const minMonth = toMonthKey(oldestStartDay);
  const [selectedMonth, setSelectedMonth] = useState<MonthKey | null>(null);
  const month =
    selectedMonth && selectedMonth >= minMonth && selectedMonth <= currentMonth
      ? selectedMonth
      : currentMonth;
  const monthOptions = getMonthOptions(minMonth, currentMonth);
  const pointerStart = useRef<{ id: number; x: number } | null>(null);
  const suppressClick = useRef(false);
  const canGoPrevious = month > minMonth;
  const canGoNext = month < currentMonth;

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    suppressClick.current = false;
    if (event.isPrimary === false) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointerStart.current = { id: event.pointerId, x: event.clientX };
  }

  function handlePointerUp(event: PointerEvent<HTMLElement>) {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start || start.id !== event.pointerId) return;

    const distance = event.clientX - start.x;
    if (Math.abs(distance) < 48) return;

    // Treat a horizontal gesture as navigation even at a month boundary;
    // never let the same gesture accidentally activate a day or habit link.
    suppressClick.current = true;

    // RTL: swipe right for the previous month, left for the next month.
    if (distance > 0 && canGoPrevious) {
      setSelectedMonth(addMonths(month, -1));
    } else if (distance < 0 && canGoNext) {
      setSelectedMonth(addMonths(month, 1));
    }
  }

  function handleClickCapture(event: MouseEvent<HTMLElement>) {
    if (!suppressClick.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick.current = false;
  }

  return (
    <section
      className="habit-month-overview touch-pan-y"
      aria-label="شبكة العادات الشهرية"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        pointerStart.current = null;
        suppressClick.current = false;
      }}
      onClickCapture={handleClickCapture}
    >
      <header className="mb-3 flex items-center justify-between gap-2 rounded-2xl border bg-card px-3 py-2.5">
        <button
          type="button"
          onClick={() => setSelectedMonth(addMonths(month, -1))}
          disabled={!canGoPrevious}
          aria-label="الشهر السابق"
          className="habit-month-nav grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
        >
          <Icon name="chevron_right" className="size-5" />
        </button>

        <div className="flex min-w-0 flex-1 items-center justify-center">
          <select
            aria-label="اختيار شهر العادات"
            value={month}
            onChange={(event) => setSelectedMonth(event.target.value as MonthKey)}
            className="habit-month-overview-picker max-w-full rounded-xl bg-transparent px-2 py-2 text-center text-base font-bold text-foreground"
          >
            {monthOptions.map((option) => (
              <option key={option} value={option}>
                {monthLabelFmt.format(parseDayKey(firstDayOfMonth(option)))}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => setSelectedMonth(addMonths(month, 1))}
          disabled={!canGoNext}
          aria-label="الشهر التالي"
          className="habit-month-nav grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
        >
          <Icon name="chevron_left" className="size-5" />
        </button>
      </header>

      {month !== currentMonth && (
        <div className="mb-3 flex justify-center">
          <button
            type="button"
            onClick={() => setSelectedMonth(currentMonth)}
            className="rounded-full px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-accent"
          >
            العودة لهذا الشهر
          </button>
        </div>
      )}

      <ul className="grid gap-3 sm:grid-cols-2">
        {habits.map((habit) => (
          <HabitMonthCard
            key={habit.id}
            habit={habit}
            month={month}
            today={today}
            days={daysByHabit.get(habit.id) ?? new Set<DayKey>()}
          />
        ))}
      </ul>

      <p className="mt-3 text-center text-[10px] text-muted-foreground">
        اسحب يمينًا أو شمالًا للتنقل بين الشهور
      </p>
    </section>
  );
}

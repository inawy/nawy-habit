import { useRef, type TouchEvent } from "react";
import { Icon } from "@/components/icon";

import { parseDayKey, type DayKey } from "@/lib/date/day-key";
import {
  addMonths,
  firstDayOfMonth,
  monthGrid,
  toMonthKey,
  weekDays,
  type MonthKey,
} from "@/lib/date/month";
import { arabicFmt } from "@/lib/format/numbers";
import { cn } from "@/lib/utils";

const weekdayFmt = arabicFmt({ weekday: "short" });
const dayFmt = arabicFmt({ day: "numeric" });
const monthNameFmt = arabicFmt({ month: "long" });
const monthFmt = arabicFmt({ month: "long", year: "numeric" });
const fullDateFmt = arabicFmt({
  weekday: "long",
  day: "numeric",
  month: "long",
});

interface Props {
  month: MonthKey;
  minMonth: MonthKey;
  days: Set<DayKey>;
  today: DayKey;
  onMonthChange: (month: MonthKey) => void;
  onToggle: (day: DayKey) => void;
}

/** Swipeable monthly calendar with direct month/year navigation. */
export function HabitCalendar({
  month,
  minMonth,
  days,
  today,
  onMonthChange,
  onToggle,
}: Props) {
  const touchStartX = useRef<number | null>(null);
  const cells = monthGrid(month);
  const header = weekDays(firstDayOfMonth(month)).map((d) =>
    weekdayFmt.format(parseDayKey(d)),
  );
  const label = monthFmt.format(parseDayKey(firstDayOfMonth(month)));
  const currentMonth = toMonthKey(today);
  const selectedYear = Number(month.slice(0, 4));
  const minimumYear = Number(minMonth.slice(0, 4));
  const currentYear = Number(currentMonth.slice(0, 4));
  const years = Array.from(
    { length: currentYear - minimumYear + 1 },
    (_, index) => minimumYear + index,
  );
  const availableMonths = Array.from({ length: 12 }, (_, index) =>
    String(index + 1).padStart(2, "0"),
  ).filter((value) => {
    const key = String(selectedYear) + "-" + value;
    return key >= minMonth && key <= currentMonth;
  });
  const canGoPrevious = month > minMonth;
  const canGoNext = month < currentMonth;

  function handleTouchStart(event: TouchEvent<HTMLElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLElement>) {
    const startX = touchStartX.current;
    const endX = event.changedTouches[0]?.clientX;
    touchStartX.current = null;
    if (startX === null || endX === undefined) return;

    const distance = endX - startX;
    if (Math.abs(distance) < 48) return;

    // RTL: swipe right for an older month, left for a newer month.
    if (distance > 0 && canGoPrevious) {
      onMonthChange(addMonths(month, -1));
    } else if (distance < 0 && canGoNext) {
      onMonthChange(addMonths(month, 1));
    }
  }

  function handleMonthSelect(value: string) {
    onMonthChange(String(selectedYear) + "-" + value);
  }

  function handleYearSelect(value: string) {
    const requested = value + "-" + month.slice(5, 7);
    if (requested < minMonth) {
      onMonthChange(minMonth);
    } else if (requested > currentMonth) {
      onMonthChange(currentMonth);
    } else {
      onMonthChange(requested);
    }
  }

  return (
    <section
      className="habit-month-calendar rounded-2xl border bg-card p-4 shadow-sm touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        touchStartX.current = null;
      }}
      aria-label="تقويم العادة الشهري"
    >
      <header className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, -1))}
          disabled={!canGoPrevious}
          aria-label="الشهر السابق"
          className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-35"
        >
          <Icon name="chevron_right" className="size-5" />
        </button>

        <div className="flex min-w-0 items-center justify-center gap-1.5">
          <select
            aria-label="اختيار الشهر"
            value={month.slice(5, 7)}
            onChange={(event) => handleMonthSelect(event.target.value)}
            className="habit-month-picker min-w-0 rounded-lg border bg-background px-2 py-1.5 text-sm font-semibold"
          >
            {availableMonths.map((value) => (
              <option key={value} value={value}>
                {monthNameFmt.format(
                  new Date(selectedYear, Number(value) - 1, 1, 12),
                )}
              </option>
            ))}
          </select>
          <select
            aria-label="اختيار السنة"
            value={String(selectedYear)}
            onChange={(event) => handleYearSelect(event.target.value)}
            className="habit-month-picker rounded-lg border bg-background px-2 py-1.5 text-sm font-semibold tabular-nums"
          >
            {years.map((year) => (
              <option key={year} value={String(year)}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, 1))}
          disabled={!canGoNext}
          aria-label="الشهر التالي"
          className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-35"
        >
          <Icon name="chevron_left" className="size-5" />
        </button>
      </header>

      {month !== currentMonth && (
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            onClick={() => onMonthChange(currentMonth)}
            className="rounded-full px-3 py-1 text-xs font-medium text-primary hover:bg-accent"
          >
            العودة لهذا الشهر
          </button>
        </div>
      )}

      <div className="mt-3 grid grid-cols-7 gap-1.5" aria-hidden>
        {header.map((weekday, index) => (
          <span
            key={index}
            className="text-center text-[11px] text-muted-foreground"
          >
            {weekday}
          </span>
        ))}
      </div>

      <ol className="mt-1.5 grid grid-cols-7 gap-1.5" aria-label={"أيام " + label}>
        {cells.map((day, index) =>
          day === null ? (
            <li key={"gap-" + index} aria-hidden />
          ) : (
            <li key={day}>
              <button
                type="button"
                onClick={() => onToggle(day)}
                disabled={day > today}
                aria-pressed={days.has(day)}
                aria-label={
                  days.has(day)
                    ? fullDateFmt.format(parseDayKey(day)) + " — تم، اضغط للإلغاء"
                    : fullDateFmt.format(parseDayKey(day)) + " — لم يتم"
                }
                className={cn(
                  "grid aspect-square w-full place-items-center rounded-lg border text-sm tabular-nums transition-colors",
                  days.has(day)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:border-primary/60",
                  day > today && "opacity-35",
                  day === today && "ring-2 ring-ring ring-offset-1 ring-offset-card",
                )}
              >
                {dayFmt.format(parseDayKey(day))}
              </button>
            </li>
          ),
        )}
      </ol>

      <p className="mt-3 text-center text-[10px] text-muted-foreground">
        اسحب يمينًا أو شمالًا للتنقل بين الشهور
      </p>
    </section>
  );
}

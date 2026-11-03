import { addDays, parseDayKey, type DayKey } from "@/lib/date/day-key";
import { arabicFmt, num } from "@/lib/format/numbers";
import type { HabitColorName } from "@/lib/habits/appearance";
import { cn } from "@/lib/utils";

const MIN_WEEK_COUNT = 52;
const dateFmt = arabicFmt({ day: "numeric", month: "long", year: "numeric" });
const monthFmt = arabicFmt({ month: "short" });
const yearFmt = arabicFmt({ year: "numeric" });

interface Props {
  days: Set<DayKey>;
  today: DayKey;
  color?: HabitColorName;
  compact?: boolean;
  startDate?: DayKey;
}

/** A year at minimum; the detail view expands to the habit's full recorded lifetime. */
export function HabitActivityGrid({
  days,
  today,
  color = "blue",
  compact = false,
  startDate,
}: Props) {
  const todayDate = parseDayKey(today);
  const mondayOffset = (todayDate.getDay() + 6) % 7;
  const currentWeekStart = addDays(today, -mondayOffset);
  const oldestLog = Array.from(days).sort()[0] ?? today;
  const oldestRecordedDay =
    startDate && startDate < oldestLog ? startDate : oldestLog;
  const oldestRecordedDate = parseDayKey(oldestRecordedDay);
  const oldestRecordedWeek = addDays(
    oldestRecordedDay,
    -((oldestRecordedDate.getDay() + 6) % 7),
  );
  const minimumWindowStart = addDays(currentWeekStart, -(MIN_WEEK_COUNT - 1) * 7);
  const firstWeekStart =
    !compact && oldestRecordedWeek < minimumWindowStart
      ? oldestRecordedWeek
      : minimumWindowStart;
  const spanInWeeks = Math.round(
    (parseDayKey(currentWeekStart).getTime() - parseDayKey(firstWeekStart).getTime()) /
      (7 * 24 * 60 * 60 * 1000),
  );
  const weekCount = Math.max(MIN_WEEK_COUNT, spanInWeeks + 1);

  // Newest week first: in RTL the current week stays at the right edge.
  const weekStarts = Array.from({ length: weekCount }, (_, index) =>
    addDays(currentWeekStart, -index * 7),
  );
  const completed = weekStarts.reduce((count, weekStart) => {
    for (let day = 0; day < 7; day += 1) {
      const date = addDays(weekStart, day);
      if (date <= today && days.has(date)) count += 1;
    }
    return count;
  }, 0);

  const monthMarkers = weekStarts.flatMap((weekStart, weekIndex) => {
    const firstOfMonth = Array.from({ length: 7 }, (_, day) =>
      addDays(weekStart, day),
    ).find((day) => day.slice(8, 10) === "01");
    return firstOfMonth
      ? [{ week: weekIndex, label: monthFmt.format(parseDayKey(firstOfMonth)) }]
      : [];
  });
  const oldestWeekDate = weekStarts[weekStarts.length - 1] ?? currentWeekStart;
  const isScrollable = !compact && weekCount > MIN_WEEK_COUNT;
  const gridMinWidth = isScrollable ? String(weekCount * 10) + "px" : "100%";
  const historyLabel =
    weekCount > MIN_WEEK_COUNT
      ? "السجل منذ " + yearFmt.format(parseDayKey(oldestRecordedDay))
      : "آخر سنة";

  return (
    <div
      className={cn("habit-heatmap", isScrollable && "habit-heatmap-scroll")}
      data-habit-color={color}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>{compact ? "آخر سنة" : historyLabel}</span>
        <span>{num(completed)} يوم إنجاز</span>
      </div>
      <div className="habit-heatmap-viewport" style={{ minWidth: gridMinWidth }}>
        <div className="relative mb-1 h-3 overflow-hidden" aria-hidden="true">
          {monthMarkers.map((marker) => (
            <span
              key={marker.week}
              className="absolute top-0 whitespace-nowrap text-[9px] leading-none text-muted-foreground"
              style={{ insetInlineStart: String((marker.week / weekCount) * 100) + "%" }}
            >
              {marker.label}
            </span>
          ))}
        </div>
        <ol
          className={cn(
            "habit-heatmap-grid grid grid-flow-col grid-rows-7 gap-[2px]",
            compact ? "gap-[2px]" : "gap-[2px]",
          )}
          style={{
            gridTemplateColumns: "repeat(" + weekCount + ", minmax(0, 1fr))",
          }}
          aria-label={
            compact
              ? "شبكة أيام الإنجاز لآخر سنة"
              : "شبكة تاريخ العادة بالكامل، أسبوع لكل عمود"
          }
        >
          {weekStarts.flatMap((weekStart) =>
            Array.from({ length: 7 }, (_, dayIndex) => {
              const day = addDays(weekStart, dayIndex);
              const isFuture = day > today;
              const complete = days.has(day);
              const label =
                dateFmt.format(parseDayKey(day)) +
                " — " +
                (complete ? "تم الإنجاز" : "بدون تسجيل") +
                (day === today ? " — اليوم" : "");

              return (
                <li
                  key={day}
                  title={isFuture ? undefined : label}
                  aria-label={isFuture ? undefined : label}
                  aria-hidden={isFuture}
                  className={cn(
                    "habit-heatmap-cell aspect-square min-w-0 rounded-[2px] border",
                    isFuture ? "is-future" : complete ? "is-complete" : "is-empty",
                    day === today && "is-today",
                  )}
                />
              );
            }),
          )}
        </ol>
      </div>
      {!compact && (
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{dateFmt.format(parseDayKey(oldestWeekDate))}</span>
          <span>اليوم</span>
        </div>
      )}
    </div>
  );
}

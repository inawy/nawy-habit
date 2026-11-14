import { memo, useMemo } from "react";

import { addDays, parseDayKey, type DayKey } from "@/lib/date/day-key";
import { arabicFmt, num } from "@/lib/format/numbers";
import type { HabitColorName } from "@/lib/habits/appearance";
import { cn } from "@/lib/utils";

const MIN_WEEK_COUNT = 52;
const CELL_PITCH = 14;
const COMPACT_WEEK_COUNT = 24;
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

interface CompactCell {
  day: DayKey;
  isFuture: boolean;
  isToday: boolean;
  /** Long Arabic date, formatted once per day and shared by every card. */
  dateLabel: string;
}

/**
 * The 24x7 day layout depends only on "today", not on the habit, so it is built once and shared by
 * all cards. Formatting 168 dates with Intl for every card on every render was the main cost of
 * painting the Today screen on slower phones.
 */
let layoutCache: { today: DayKey; cells: CompactCell[] } | undefined;

function compactLayout(today: DayKey): CompactCell[] {
  if (layoutCache?.today === today) return layoutCache.cells;
  const currentWeekStart = addDays(today, -((parseDayKey(today).getDay() + 6) % 7));
  // Newest week first: the current week sits at the inline-start edge (right in RTL).
  const cells = Array.from({ length: COMPACT_WEEK_COUNT }, (_, week) =>
    addDays(currentWeekStart, -week * 7),
  ).flatMap((weekStart) =>
    Array.from({ length: 7 }, (_, dayIndex): CompactCell => {
      const day = addDays(weekStart, dayIndex);
      return {
        day,
        isFuture: day > today,
        isToday: day === today,
        dateLabel: day > today ? "" : dateFmt.format(parseDayKey(day)),
      };
    }),
  );
  layoutCache = { today, cells };
  return cells;
}

const CompactActivityGrid = memo(function CompactActivityGrid({
  days,
  today,
  color,
}: {
  days: Set<DayKey>;
  today: DayKey;
  color: HabitColorName;
}) {
  const cells = useMemo(() => compactLayout(today), [today]);
  const completed = useMemo(() => {
    let count = 0;
    for (const cell of cells) if (!cell.isFuture && days.has(cell.day)) count += 1;
    return count;
  }, [cells, days]);

  // Overview cards show a light rolling window: 24 week columns x 7 day rows. The oldest weeks
  // fade out at the opposite edge; the detail screen still shows the full history.
  return (
    <div className="habit-heatmap" data-habit-color={color}>
      <ol
        className="habit-heatmap-grid habit-heatmap-fade grid grid-flow-col grid-rows-7 gap-[3px] p-[3px]"
        style={{ gridTemplateColumns: `repeat(${COMPACT_WEEK_COUNT}, minmax(0, 1fr))` }}
        aria-label={`إنجازات العادة خلال آخر ${num(COMPACT_WEEK_COUNT)} أسبوعًا — ${num(completed)} يوم إنجاز`}
      >
        {cells.map((cell) => {
          const complete = !cell.isFuture && days.has(cell.day);
          const label = cell.isFuture
            ? undefined
            : `${cell.dateLabel} — ${complete ? "تم الإنجاز" : "بدون تسجيل"}${cell.isToday ? " — اليوم" : ""}`;

          return (
            <li
              key={cell.day}
              title={label}
              aria-label={label}
              aria-hidden={cell.isFuture}
              className={cn(
                "habit-heatmap-cell aspect-square min-w-0 rounded-[28%]",
                cell.isFuture ? "is-future" : complete ? "is-complete" : "is-empty",
                cell.isToday && "is-today",
              )}
            />
          );
        })}
      </ol>
    </div>
  );
});

/** Overview cards show a rolling 24-week window; the detail view keeps the full recorded lifetime. */
export function HabitActivityGrid({
  days,
  today,
  color = "blue",
  compact = false,
  startDate,
}: Props) {
  if (compact) return <CompactActivityGrid days={days} today={today} color={color} />;

  const todayDate = parseDayKey(today);
  const mondayOffset = (todayDate.getDay() + 6) % 7;
  const currentWeekStart = addDays(today, -mondayOffset);
  const oldestLog = Array.from(days).sort()[0] ?? today;
  const oldestRecordedDay = startDate && startDate < oldestLog ? startDate : oldestLog;
  const oldestRecordedDate = parseDayKey(oldestRecordedDay);
  const oldestRecordedWeek = addDays(oldestRecordedDay, -((oldestRecordedDate.getDay() + 6) % 7));
  const minimumWindowStart = addDays(currentWeekStart, -(MIN_WEEK_COUNT - 1) * 7);
  const firstWeekStart =
    !compact && oldestRecordedWeek < minimumWindowStart ? oldestRecordedWeek : minimumWindowStart;
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
    const firstOfMonth = Array.from({ length: 7 }, (_, day) => addDays(weekStart, day)).find(
      (day) => day.slice(8, 10) === "01",
    );
    return firstOfMonth
      ? [{ week: weekIndex, label: monthFmt.format(parseDayKey(firstOfMonth)) }]
      : [];
  });
  const yearMarkers = weekStarts.flatMap((weekStart, weekIndex) => {
    const firstOfYear = Array.from({ length: 7 }, (_, day) => addDays(weekStart, day)).find(
      (day) => day.slice(5, 10) === "01-01",
    );
    return firstOfYear
      ? [{ week: weekIndex, label: yearFmt.format(parseDayKey(firstOfYear)) }]
      : [];
  });
  const oldestWeekDate = weekStarts[weekStarts.length - 1] ?? currentWeekStart;
  // 11px cells + 3px gaps: always legible on phones; the strip scrolls sideways when it must.
  const gridMinWidth = String(weekCount * CELL_PITCH) + "px";
  const historyLabel =
    weekCount > MIN_WEEK_COUNT
      ? "السجل منذ " + yearFmt.format(parseDayKey(oldestRecordedDay))
      : "آخر سنة";

  return (
    <div className="habit-heatmap overflow-x-auto pb-1" data-habit-color={color}>
      <div className="sticky start-0 mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{compact ? "آخر سنة" : historyLabel}</span>
        <span>{num(completed)} يوم إنجاز</span>
      </div>
      <div className="habit-heatmap-viewport" style={{ minWidth: gridMinWidth }}>
        {weekCount > MIN_WEEK_COUNT && (
          <div className="relative mb-1 h-3.5 overflow-hidden" aria-hidden="true">
            {yearMarkers.map((marker) => (
              <span
                key={marker.week}
                className="absolute top-0 whitespace-nowrap text-[10px] font-semibold leading-none text-foreground/70"
                style={{ insetInlineStart: String((marker.week / weekCount) * 100) + "%" }}
              >
                {marker.label}
              </span>
            ))}
          </div>
        )}
        <div className="relative mb-1.5 h-3.5 overflow-hidden" aria-hidden="true">
          {monthMarkers.map((marker) => (
            <span
              key={marker.week}
              className="absolute top-0 whitespace-nowrap text-[10px] leading-none text-muted-foreground"
              style={{ insetInlineStart: String((marker.week / weekCount) * 100) + "%" }}
            >
              {marker.label}
            </span>
          ))}
        </div>
        <ol
          className="habit-heatmap-grid grid grid-flow-col grid-rows-7 gap-[3px]"
          style={{
            gridTemplateColumns: "repeat(" + weekCount + ", minmax(0, 1fr))",
          }}
          aria-label={
            compact ? "شبكة أيام الإنجاز لآخر سنة" : "شبكة تاريخ العادة بالكامل، أسبوع لكل عمود"
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
                    "habit-heatmap-cell aspect-square min-w-0 rounded-[3px] border",
                    isFuture ? "is-future" : complete ? "is-complete" : "is-empty",
                    day === today && "is-today",
                  )}
                />
              );
            }),
          )}
        </ol>
      </div>
      <div className="sticky start-0 mt-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
        <span className="tabular-nums">{dateFmt.format(parseDayKey(oldestWeekDate))} ← اليوم</span>
        <ul className="flex items-center gap-3" aria-label="دليل الألوان">
          <li className="flex items-center gap-1.5">
            <span className="habit-heatmap-cell is-complete size-2.5 rounded-[3px] border" />
            تم
          </li>
          <li className="flex items-center gap-1.5">
            <span className="habit-heatmap-cell is-empty size-2.5 rounded-[3px] border" />
            بدون تسجيل
          </li>
          <li className="flex items-center gap-1.5">
            <span className="habit-heatmap-cell is-empty is-today size-2.5 rounded-[3px] border" />
            اليوم
          </li>
        </ul>
      </div>
    </div>
  );
}

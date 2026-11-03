import { addDays, parseDayKey, type DayKey } from "@/lib/date/day-key";
import { arabicFmt, num } from "@/lib/format/numbers";
import type { HabitColorName } from "@/lib/habits/appearance";
import { cn } from "@/lib/utils";

const WEEK_COUNT = 52;
const dateFmt = arabicFmt({ day: "numeric", month: "long", year: "numeric" });
const monthFmt = arabicFmt({ month: "short" });

interface Props {
  days: Set<DayKey>;
  today: DayKey;
  color?: HabitColorName;
  compact?: boolean;
}

/** Fifty-two calendar-aligned weeks, with future days left blank. */
export function HabitActivityGrid({ days, today, color = "blue", compact = false }: Props) {
  const todayDate = parseDayKey(today);
  const mondayOffset = (todayDate.getDay() + 6) % 7;
  const currentWeekStart = addDays(today, -mondayOffset);
  const firstDay = addDays(currentWeekStart, -(WEEK_COUNT - 1) * 7);
  const dates = Array.from({ length: WEEK_COUNT * 7 }, (_, index) => addDays(firstDay, index));
  const completed = dates.filter((day) => day <= today && days.has(day)).length;
  const monthMarkers = dates.flatMap((day, index) =>
    day.slice(8, 10) === "01"
      ? [{ week: Math.floor(index / 7), label: monthFmt.format(parseDayKey(day)) }]
      : [],
  );

  return (
    <div className="habit-heatmap" data-habit-color={color}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>{compact ? "آخر سنة" : `آخر ${num(WEEK_COUNT)} أسبوع`}</span>
        <span>{num(completed)} يوم إنجاز</span>
      </div>
      <div className="relative mb-1 h-3 overflow-hidden" aria-hidden="true">
        {monthMarkers.map((marker) => (
          <span
            key={marker.week}
            className="absolute top-0 whitespace-nowrap text-[9px] leading-none text-muted-foreground"
            style={{ insetInlineStart: String((marker.week / WEEK_COUNT) * 100) + "%" }}
          >
            {marker.label}
          </span>
        ))}
      </div>
      <ol
        className={cn(
          "habit-heatmap-grid grid grid-flow-col grid-cols-[repeat(52,minmax(0,1fr))] grid-rows-7",
          compact ? "gap-[2px]" : "gap-[3px]",
        )}
        aria-label="شبكة أيام الإنجاز لآخر سنة تقريبًا"
      >
        {dates.map((day) => {
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
        })}
      </ol>
      {!compact && (
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{dateFmt.format(parseDayKey(firstDay))}</span>
          <span>اليوم</span>
        </div>
      )}
    </div>
  );
}

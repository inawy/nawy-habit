import { addDays, parseDayKey, type DayKey } from "@/lib/date/day-key";
import { arabicFmt, num } from "@/lib/format/numbers";
import { cn } from "@/lib/utils";

const WEEK_COUNT = 26;
const dateFmt = arabicFmt({ day: "numeric", month: "long", year: "numeric" });
const monthFmt = arabicFmt({ month: "short" });

interface Props {
  days: Set<DayKey>;
  today: DayKey;
}

/** Twenty-six calendar-aligned weeks, with future days left blank. */
export function HabitActivityGrid({ days, today }: Props) {
  const todayDate = parseDayKey(today);
  const mondayOffset = (todayDate.getDay() + 6) % 7;
  const currentWeekStart = addDays(today, -mondayOffset);
  const firstDay = addDays(currentWeekStart, -(WEEK_COUNT - 1) * 7);
  const dates = Array.from({ length: WEEK_COUNT * 7 }, (_, index) =>
    addDays(firstDay, index),
  );
  const completed = dates.filter((day) => day <= today && days.has(day)).length;
  const monthMarkers = dates.flatMap((day, index) =>
    day.slice(8, 10) === "01"
      ? [{ week: Math.floor(index / 7), label: monthFmt.format(parseDayKey(day)) }]
      : [],
  );

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>آخر {num(WEEK_COUNT)} أسبوع</span>
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
        className="grid grid-flow-col grid-cols-[repeat(26,minmax(0,1fr))] grid-rows-7 gap-[3px]"
        aria-label="شبكة أيام الإنجاز لآخر ستة أشهر تقريبًا"
      >
        {dates.map((day) => {
          const isFuture = day > today;
          const label =
            dateFmt.format(parseDayKey(day)) +
            " — " +
            (days.has(day) ? "تم الإنجاز" : "بدون تسجيل") +
            (day === today ? " — اليوم" : "");

          return (
            <li
              key={day}
              title={isFuture ? undefined : label}
              aria-label={isFuture ? undefined : label}
              aria-hidden={isFuture}
              className={cn(
                "aspect-square min-w-0 rounded-[3px] border",
                isFuture
                  ? "border-transparent bg-transparent"
                  : days.has(day)
                    ? "border-primary bg-primary"
                    : "border-border bg-muted",
                day === today && "ring-1 ring-ring ring-offset-1 ring-offset-card",
              )}
            />
          );
        })}
      </ol>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{dateFmt.format(parseDayKey(firstDay))}</span>
        <span>اليوم</span>
      </div>
    </div>
  );
}

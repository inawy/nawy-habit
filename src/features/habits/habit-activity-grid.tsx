import { lastDays, parseDayKey, type DayKey } from "@/lib/date/day-key";
import { arabicFmt, num } from "@/lib/format/numbers";
import { cn } from "@/lib/utils";

const dateFmt = arabicFmt({ day: "numeric", month: "long", year: "numeric" });

interface Props {
  days: Set<DayKey>;
  today: DayKey;
}

/** Twelve complete columns ending today; no future dates or storage writes. */
export function HabitActivityGrid({ days, today }: Props) {
  const dates = lastDays(today, 84);
  const completed = dates.filter((day) => days.has(day)).length;

  return (
    <div className="mt-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>آخر {num(12)} أسبوع</span>
        <span>{num(completed)} يوم إنجاز</span>
      </div>
      <ol
        className="grid grid-flow-col grid-cols-12 grid-rows-7 gap-1"
        aria-label="شبكة أيام الإنجاز"
      >
        {dates.map((day) => {
          const label = `${dateFmt.format(parseDayKey(day))} — ${days.has(day) ? "تم الإنجاز" : "بدون تسجيل"}${day === today ? " — اليوم" : ""}`;
          return (
            <li
              key={day}
              title={label}
              aria-label={label}
              className={cn(
                "aspect-square min-w-0 rounded-sm border",
                days.has(day) ? "border-primary bg-primary" : "border-border bg-muted",
                day === today && "ring-1 ring-ring ring-offset-1 ring-offset-card",
              )}
            />
          );
        })}
      </ol>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{dateFmt.format(parseDayKey(dates[0] ?? today))}</span>
        <span>اليوم</span>
      </div>
    </div>
  );
}
import { ChevronLeft, ChevronRight } from "lucide-react";

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
const monthFmt = arabicFmt({ month: "long", year: "numeric" });
const fullDateFmt = arabicFmt({
  weekday: "long",
  day: "numeric",
  month: "long",
});

interface Props {
  month: MonthKey;
  days: Set<DayKey>;
  today: DayKey;
  onMonthChange: (month: MonthKey) => void;
  onToggle: (day: DayKey) => void;
}

/** Monthly calendar. Past days can be checked or unchecked; future days are inert. */
export function HabitCalendar({ month, days, today, onMonthChange, onToggle }: Props) {
  const cells = monthGrid(month);
  const header = weekDays(firstDayOfMonth(month)).map((d) => weekdayFmt.format(parseDayKey(d)));
  const label = monthFmt.format(parseDayKey(firstDayOfMonth(month)));
  const isThisMonth = month === toMonthKey(today);

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm">
      <header className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, -1))}
          aria-label="الشهر السابق"
          className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
        >
          <ChevronRight className="size-5" />
        </button>
        <h2 className="text-base font-semibold">{label}</h2>
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, 1))}
          disabled={isThisMonth}
          aria-label="الشهر التالي"
          className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-40"
        >
          <ChevronLeft className="size-5" />
        </button>
      </header>

      <div className="mt-3 grid grid-cols-7 gap-1.5" aria-hidden>
        {header.map((w) => (
          <span key={w} className="text-center text-[11px] text-muted-foreground">
            {w}
          </span>
        ))}
      </div>

      <ol className="mt-1.5 grid grid-cols-7 gap-1.5" aria-label={`أيام ${label}`}>
        {cells.map((d, i) =>
          d === null ? (
            <li key={`gap-${i}`} aria-hidden />
          ) : (
            <li key={d}>
              <button
                type="button"
                onClick={() => onToggle(d)}
                disabled={d > today}
                aria-pressed={days.has(d)}
                aria-label={
                  days.has(d)
                    ? `${fullDateFmt.format(parseDayKey(d))} — تم، اضغط للإلغاء`
                    : `${fullDateFmt.format(parseDayKey(d))} — لم يتم`
                }
                className={cn(
                  "grid aspect-square w-full place-items-center rounded-lg border text-sm tabular-nums transition-colors",
                  days.has(d)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:border-primary/60",
                  d > today && "opacity-35",
                  d === today && "ring-2 ring-ring ring-offset-1 ring-offset-card",
                )}
              >
                {dayFmt.format(parseDayKey(d))}
              </button>
            </li>
          ),
        )}
      </ol>
    </section>
  );
}

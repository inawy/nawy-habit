import { lastDays, type DayKey } from "@/lib/date/day-key";
import { monthDays, type MonthKey } from "@/lib/date/month";

export interface MonthProgress {
  month: MonthKey;
  /** Completed days inside this month. */
  done: number;
  /** Days already lived through; a month still ahead has 0. */
  elapsed: number;
  /** 0..1, or null when the month has not begun yet. */
  rate: number | null;
}

/**
 * Consistency for one month. Future days are never counted against the user,
 * so a month still ahead has no rate instead of a discouraging 0%.
 */
export function monthProgress(
  days: Iterable<DayKey>,
  month: MonthKey,
  today: DayKey,
  startDate?: DayKey,
): MonthProgress {
  const set = new Set(days);
  // Generate real calendar days with identical bounds for numerator and denominator.
  const eligible = monthDays(month).filter(
    (day) => day <= today && (!startDate || day >= startDate),
  );
  const done = eligible.filter((day) => set.has(day)).length;
  const elapsed = eligible.length;

  return { month, done, elapsed, rate: elapsed === 0 ? null : done / elapsed };
}

export interface WeekProgress {
  weekStart: DayKey;
  days: DayKey[];
  done: number;
}

/** The last `count` weeks of 7 days ending today, oldest first. */
export function lastWeeks(days: Iterable<DayKey>, today: DayKey, count = 4): WeekProgress[] {
  const set = new Set(days);
  const span = lastDays(today, count * 7);
  return Array.from({ length: count }, (_, i) => {
    const week = span.slice(i * 7, (i + 1) * 7);
    return {
      weekStart: week[0] ?? today,
      days: week,
      done: week.filter((d) => set.has(d)).length,
    };
  });
}

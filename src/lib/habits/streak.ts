import { addDays, type DayKey } from "@/lib/date/day-key";

export interface StreakSummary {
  /** Consecutive completed days ending today, or yesterday if today is still open. */
  current: number;
  best: number;
  total: number;
}

/**
 * Today not being done yet never breaks the streak — the user still has time.
 * Missed days end a streak but never erase history (best + total stay).
 */
export function computeStreaks(days: Iterable<DayKey>, today: DayKey): StreakSummary {
  const set = new Set(days);
  const sorted = [...set].sort();

  let best = 0;
  let run = 0;
  let prev: DayKey | null = null;
  for (const day of sorted) {
    run = prev !== null && addDays(prev, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    prev = day;
  }

  let cursor = set.has(today) ? today : addDays(today, -1);
  let current = 0;
  while (set.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  return { current, best, total: set.size };
}

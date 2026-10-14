/**
 * A DayKey is a local calendar day in the form YYYY-MM-DD.
 * Habit logs are keyed by DayKey (not timestamps) so a check-in always
 * belongs to the day the user saw on their device.
 */
export type DayKey = string;

const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDayKey(value: string): value is DayKey {
  if (!DAY_KEY_RE.test(value)) return false;
  const d = parseDayKey(value);
  return toDayKey(d) === value;
}

export function toDayKey(date: Date): DayKey {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parses a DayKey to a local Date at noon (noon avoids DST edge cases). */
export function parseDayKey(key: DayKey): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1, 12);
}

export function addDays(key: DayKey, amount: number): DayKey {
  const date = parseDayKey(key);
  date.setDate(date.getDate() + amount);
  return toDayKey(date);
}

export function todayKey(now: Date = new Date()): DayKey {
  return toDayKey(now);
}

/** Returns the last `count` day keys ending at `end` (oldest first). */
export function lastDays(end: DayKey, count: number): DayKey[] {
  return Array.from({ length: count }, (_, i) => addDays(end, i - count + 1));
}

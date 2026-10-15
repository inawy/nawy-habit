import { addDays, parseDayKey, toDayKey, type DayKey } from "./day-key";

/** A MonthKey is a local calendar month in the form YYYY-MM. */
export type MonthKey = string;

const MONTH_KEY_RE = /^\d{4}-\d{2}$/;

export function isMonthKey(value: string): value is MonthKey {
  if (!MONTH_KEY_RE.test(value)) return false;
  const [year, month] = value.split("-").map(Number);
  return (year ?? 0) > 0 && (month ?? 0) >= 1 && (month ?? 0) <= 12;
}

/** "2026-10-14" -> "2026-10" */
export function toMonthKey(day: DayKey): MonthKey {
  return day.slice(0, 7);
}

export function firstDayOfMonth(month: MonthKey): DayKey {
  return `${month}-01`;
}

export function daysInMonth(month: MonthKey): number {
  const [year, num] = month.split("-").map(Number);
  return new Date(year ?? 0, num ?? 1, 0).getDate();
}

export function addMonths(month: MonthKey, delta: number): MonthKey {
  const [year, num] = month.split("-").map(Number);
  const date = new Date(year ?? 0, (num ?? 1) - 1 + delta, 1, 12);
  return toMonthKey(toDayKey(date));
}

/** Every day of the month, oldest first. */
export function monthDays(month: MonthKey): DayKey[] {
  const first = firstDayOfMonth(month);
  return Array.from({ length: daysInMonth(month) }, (_, i) => addDays(first, i));
}

/**
 * Full-week calendar grid for a month; `null` marks a cell outside the month.
 * `weekStartsOn` uses JS weekday numbering (0 = Sunday … 6 = Saturday);
 * Saturday is the Arabic week start.
 */
export function monthGrid(month: MonthKey, weekStartsOn = 6): (DayKey | null)[] {
  const firstWeekday = parseDayKey(firstDayOfMonth(month)).getDay();
  const leading = (firstWeekday - weekStartsOn + 7) % 7;
  const cells: (DayKey | null)[] = Array.from({ length: leading }, () => null);
  cells.push(...monthDays(month));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** The seven day keys of the week containing `anchor`, ordered by weekday. */
export function weekDays(anchor: DayKey, weekStartsOn = 6): DayKey[] {
  const anchorWeekday = parseDayKey(anchor).getDay();
  const back = (anchorWeekday - weekStartsOn + 7) % 7;
  return Array.from({ length: 7 }, (_, i) => addDays(anchor, i - back));
}

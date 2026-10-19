import { z } from "zod";

import { MAX_REMINDERS_PER_DAY, type ReminderSlot } from "./slots";

const dayKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid day key");

const stateSchema = z.object({
  day: dayKeySchema,
  /** Indices into REMINDER_SLOTS already fired today (max MAX_REMINDERS_PER_DAY). */
  sent: z.array(z.number().int().min(0).max(MAX_REMINDERS_PER_DAY - 1)).max(MAX_REMINDERS_PER_DAY),
  /** The day the user chose "not now" on the enable banner (persists for that day only). */
  dismissedDay: dayKeySchema.nullable(),
});

export type RemindersState = z.infer<typeof stateSchema>;

const STORAGE_KEY = "nawy-reminders-v1";

const emptyState = (day: string): RemindersState => ({
  day,
  sent: [],
  dismissedDay: null,
});

function load(): RemindersState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = stateSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function save(state: RemindersState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — reminders just won't persist across reloads */
  }
}

/** State for today; stale days are discarded. */
export function getTodayState(day: string): RemindersState {
  const state = load();
  if (!state || state.day !== day) return emptyState(day);
  return state;
}

export function recordSlotSent(day: string, slot: ReminderSlot extends never ? never : number): void {
  const state = getTodayState(day);
  if (!state.sent.includes(slot)) save({ ...state, day, sent: [...state.sent, slot] });
}

export function recordDismissed(day: string): void {
  const state = getTodayState(day);
  save({ ...state, dismissedDay: day });
}

export function isDismissedToday(day: string): boolean {
  return getTodayState(day).dismissedDay === day;
}

/**
 * Reminder scheduling, local-first: fixed daily slots, at most 3 per day.
 * The user cannot configure times — the UI must never imply they can.
 */

export interface ReminderSlot {
  hour: number;
  minute: number;
}

export const MAX_REMINDERS_PER_DAY = 3;

/** Fixed, sensible times of day (local device time). */
export const REMINDER_SLOTS: readonly ReminderSlot[] = [
  { hour: 10, minute: 0 },
  { hour: 16, minute: 0 },
  { hour: 20, minute: 30 },
];

const slotMinutes = (slot: ReminderSlot): number => slot.hour * 60 + slot.minute;

/**
 * The slot that is due now, or null. Only slots whose time has already passed
 * today can be due, and each fires at most once per day. When the app opens
 * late, only the most recent passed unsent slot fires — never a burst.
 */
export function dueSlot(now: Date, sent: readonly number[]): number | null {
  const current = now.getHours() * 60 + now.getMinutes();
  for (let i = REMINDER_SLOTS.length - 1; i >= 0; i--) {
    const slot = REMINDER_SLOTS[i];
    if (slot && !sent.includes(i) && slotMinutes(slot) <= current) return i;
  }
  return null;
}

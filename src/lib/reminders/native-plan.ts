import { REMINDER_SLOTS } from "./slots";

/** Android notification channel used for every daily reminder. */
export const NATIVE_CHANNEL_ID = "reminders";
export const NATIVE_REMINDER_TITLE = "ناوي للعادات";
export const NATIVE_REMINDER_BODY = "لسه فيه عادات ما سجّلتهاش النهاردة.";

export interface PlannedReminder {
  /** Stable id (slot index + 1), so a rescheduled slot replaces itself and never piles up. */
  id: number;
  /** The next time this slot should ring. It then repeats every day at the same local time. */
  at: Date;
}

/**
 * What the phone should have scheduled right now. Pure: no Capacitor, no clock of its own.
 *
 * Each of the fixed daily slots becomes one repeating alarm. A slot that has already passed today,
 * or every slot when nothing is left to do today, starts tomorrow instead, so finishing all
 * habits silences the rest of the day. The alarm cannot know about tomorrow's habits in advance,
 * so its text is generic; opening the app recomputes the plan.
 */
export function planNativeReminders(now: Date, unfinished: number): PlannedReminder[] {
  return REMINDER_SLOTS.map((slot, index) => {
    const at = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      slot.hour,
      slot.minute,
      0,
      0,
    );
    const ringsToday = unfinished > 0 && at.getTime() > now.getTime();
    if (!ringsToday) at.setDate(at.getDate() + 1);
    return { id: index + 1, at };
  });
}

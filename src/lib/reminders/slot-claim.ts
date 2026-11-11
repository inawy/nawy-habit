import { forgetSlotSent, getTodayState, recordSlotSent } from "./reminders-store";

/**
 * Cross-window claiming for reminder slots.
 *
 * Every open window runs its own timer, so without coordination two windows
 * would both fire the same slot. Web Locks serialize the "is it already
 * fired? → record it" step across windows of this origin: the window that
 * wins the lock writes the slot to storage before releasing it, so any later
 * window reads the record and stands down.
 */
const lockName = (day: string, slot: number): string => `nawy-reminder-slot-${day}-${slot}`;

/** True only for the window that both got the lock and found the slot unfired. */
export async function tryClaimSlot(day: string, slot: number): Promise<boolean> {
  if (typeof navigator === "undefined") return false;

  if (!navigator.locks) {
    // No Web Locks (older browser): best-effort claim in this window only.
    if (getTodayState(day).sent.includes(slot)) return false;
    recordSlotSent(day, slot);
    return true;
  }

  try {
    return await navigator.locks.request(
      lockName(day, slot),
      { ifAvailable: true },
      async (lock) => {
        // Another window is claiming this slot right now — leave it to them.
        if (!lock) return false;
        if (getTodayState(day).sent.includes(slot)) return false;
        recordSlotSent(day, slot);
        return true;
      },
    );
  } catch {
    return false;
  }
}

/** Gives the slot back when the notification could not be displayed. */
export function releaseSlot(day: string, slot: number): void {
  forgetSlotSent(day, slot);
}

import { describe, beforeEach, expect, it } from "vitest";

import { dueSlot, MAX_REMINDERS_PER_DAY, REMINDER_SLOTS } from "./slots";
import {
  getTodayState,
  isDismissedToday,
  recordDismissed,
  recordSlotSent,
} from "./reminders-store";

describe("reminder slots", () => {
  it("has at most 3 slots per day", () => {
    expect(REMINDER_SLOTS).toHaveLength(MAX_REMINDERS_PER_DAY);
    expect(MAX_REMINDERS_PER_DAY).toBe(3);
  });

  it("fires nothing before the first slot", () => {
    expect(dueSlot(new Date(2026, 9, 19, 9, 59), [])).toBeNull();
  });

  it("fires a slot exactly when its time is reached", () => {
    expect(dueSlot(new Date(2026, 9, 19, 10, 0), [])).toBe(0);
  });

  it("fires the most recent passed slot when the app opens late", () => {
    // Opened at 21:00 with nothing sent: only the 20:30 slot fires, no burst.
    expect(dueSlot(new Date(2026, 9, 19, 21, 0), [])).toBe(2);
    expect(dueSlot(new Date(2026, 9, 19, 17, 0), [])).toBe(1);
  });

  it("never refires a sent slot and stops after all 3", () => {
    expect(dueSlot(new Date(2026, 9, 19, 21, 0), [2])).toBeNull();
    expect(dueSlot(new Date(2026, 9, 19, 21, 0), [0, 1])).toBe(2);
    expect(dueSlot(new Date(2026, 9, 19, 23, 0), [0, 1, 2])).toBeNull();
  });
});

describe("reminders store", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("records sent slots once per day and resets the next day", () => {
    recordSlotSent("2026-10-19", 1);
    recordSlotSent("2026-10-19", 1);
    expect(getTodayState("2026-10-19").sent).toEqual([1]);
    expect(getTodayState("2026-10-20").sent).toEqual([]);
  });

  it("caps sent slots at 3 per day", () => {
    for (const slot of [0, 1, 2]) recordSlotSent("2026-10-19", slot);
    expect(getTodayState("2026-10-19").sent).toHaveLength(3);
  });

  it("remembers dismissal for that day only", () => {
    recordDismissed("2026-10-19");
    expect(isDismissedToday("2026-10-19")).toBe(true);
    expect(isDismissedToday("2026-10-20")).toBe(false);
  });

  it("discards corrupt stored state", () => {
    window.localStorage.setItem("nawy-reminders-v1", "{not json");
    expect(getTodayState("2026-10-19").sent).toEqual([]);
  });
});

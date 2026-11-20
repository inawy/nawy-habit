import { describe, expect, it } from "vitest";

import { planNativeReminders } from "./native-plan";
import { MAX_REMINDERS_PER_DAY } from "./slots";

const at = (plan: ReturnType<typeof planNativeReminders>) =>
  plan.map((p) => [p.id, p.at.getDate(), p.at.getHours(), p.at.getMinutes()]);

describe("planNativeReminders", () => {
  it("schedules every fixed slot today when it is early and habits are unfinished", () => {
    const plan = planNativeReminders(new Date(2026, 10, 20, 8, 0), 2);
    expect(at(plan)).toEqual([
      [1, 20, 10, 0],
      [2, 20, 16, 0],
      [3, 20, 20, 30],
    ]);
  });

  it("moves slots that have already passed to tomorrow", () => {
    const plan = planNativeReminders(new Date(2026, 10, 20, 17, 0), 1);
    expect(at(plan)).toEqual([
      [1, 21, 10, 0],
      [2, 21, 16, 0],
      [3, 20, 20, 30],
    ]);
  });

  it("starts everything tomorrow when nothing is left to do today", () => {
    const plan = planNativeReminders(new Date(2026, 10, 20, 8, 0), 0);
    expect(plan.every((p) => p.at.getDate() === 21)).toBe(true);
  });

  it("treats a slot that is exactly now as passed, never in the past", () => {
    const plan = planNativeReminders(new Date(2026, 10, 20, 10, 0), 3);
    expect(plan[0]?.at.getDate()).toBe(21);
  });

  it("rolls over month ends", () => {
    const plan = planNativeReminders(new Date(2026, 10, 30, 22, 0), 3);
    expect(plan.every((p) => p.at.getMonth() === 11 && p.at.getDate() === 1)).toBe(true);
  });

  it("never plans more than the daily maximum, with distinct stable ids", () => {
    const plan = planNativeReminders(new Date(2026, 10, 20, 8, 0), 5);
    expect(plan).toHaveLength(MAX_REMINDERS_PER_DAY);
    expect(new Set(plan.map((p) => p.id)).size).toBe(plan.length);
    expect(plan.map((p) => p.id)).toEqual([1, 2, 3]);
  });

  it("always returns future times", () => {
    const now = new Date(2026, 10, 20, 13, 37);
    for (const unfinished of [0, 1, 4]) {
      for (const p of planNativeReminders(now, unfinished)) {
        expect(p.at.getTime()).toBeGreaterThan(now.getTime());
      }
    }
  });
});

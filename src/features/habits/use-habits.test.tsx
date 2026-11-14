import "fake-indexeddb/auto";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createHabit, listRecentLogsForHabits, logId, toggleLog } from "@/lib/db/habits-repo";
import { addDays, todayKey } from "@/lib/date/day-key";

import { NawyHabitDB, setDbForTests } from "@/lib/db/db";
import { useHabitsView } from "./use-habits";

let db: NawyHabitDB;

beforeEach(() => {
  db = new NawyHabitDB(`use-habits-${crypto.randomUUID()}`);
  setDbForTests(db);
});

afterEach(async () => {
  await db.delete();
  setDbForTests(null);
});

describe("useHabitsView", () => {
  it("updates repeated check-ins and preserves references for untouched habits", async () => {
    const first = await createHabit({ name: "قراءة" });
    const second = await createHabit({ name: "مشي" });
    const today = todayKey();
    const { result } = renderHook(() => useHabitsView());

    await waitFor(() => expect(result.current?.habits).toHaveLength(2));
    const secondHabitBefore = result.current?.habits.find((habit) => habit.id === second.id);
    const secondDaysBefore = result.current?.daysByHabit.get(second.id);

    await act(async () => {
      await toggleLog(first.id, today);
    });
    await waitFor(() => {
      expect(result.current?.daysByHabit.get(first.id)?.has(today)).toBe(true);
    });

    expect(result.current?.habits.find((habit) => habit.id === second.id)).toBe(secondHabitBefore);
    expect(result.current?.daysByHabit.get(second.id)).toBe(secondDaysBefore);

    await act(async () => {
      await toggleLog(first.id, today);
    });
    await waitFor(() => {
      expect(result.current?.daysByHabit.get(first.id)?.has(today) ?? false).toBe(false);
    });
  });
  it("loads a rolling window while retaining lifetime completion totals", async () => {
    const habit = await createHabit({ name: "قراءة" });
    const today = todayKey();
    const logs = Array.from({ length: 200 }, (_, index) => {
      const day = addDays(today, -(index * 2));
      return {
        id: logId(habit.id, day),
        habitId: habit.id,
        day,
        createdAt: new Date().toISOString(),
      };
    });
    await db.logs.bulkAdd(logs);

    const result = await listRecentLogsForHabits([habit.id], today);

    expect(result.logs).toHaveLength(87);
    expect(result.totalsByHabit.get(habit.id)).toBe(200);
  });

  it("keeps unusually long consecutive streak history intact", async () => {
    const habit = await createHabit({ name: "مشي" });
    const today = todayKey();
    const logs = Array.from({ length: 180 }, (_, index) => {
      const day = addDays(today, -index);
      return {
        id: logId(habit.id, day),
        habitId: habit.id,
        day,
        createdAt: new Date().toISOString(),
      };
    });
    await db.logs.bulkAdd(logs);

    const result = await listRecentLogsForHabits([habit.id], today);

    expect(result.logs).toHaveLength(180);
    expect(result.totalsByHabit.get(habit.id)).toBe(180);
  });

});

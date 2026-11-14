import "fake-indexeddb/auto";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { toggleLog, createHabit } from "@/lib/db/habits-repo";
import { todayKey } from "@/lib/date/day-key";

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
      expect(result.current?.daysByHabit.get(first.id)?.has(today)).toBe(false);
    });
  });
});

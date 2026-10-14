import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { NawyHabitDB, setDbForTests } from "./db";
import {
  archiveHabit,
  createHabit,
  listActiveHabits,
  listLogs,
  toggleLog,
  updateHabit,
} from "./habits-repo";

let db: NawyHabitDB;

beforeEach(() => {
  db = new NawyHabitDB(`test-${crypto.randomUUID()}`);
  setDbForTests(db);
});
afterEach(async () => {
  await db.delete();
  setDbForTests(null);
});

describe("habits repository", () => {
  it("creates habits in order and validates input", async () => {
    await createHabit({ name: "  قراءة  ", emoji: "📖" });
    await createHabit({ name: "مشي" });
    const habits = await listActiveHabits();
    expect(habits.map((h) => h.name)).toEqual(["قراءة", "مشي"]);
    expect(habits[1]?.emoji).toBe("✨");
    await expect(createHabit({ name: "   " })).rejects.toThrow();
  });

  it("updates and archives without deleting history", async () => {
    const h = await createHabit({ name: "a" });
    await toggleLog(h.id, "2026-10-14");
    await updateHabit(h.id, { name: "b", emoji: "💧" });
    await archiveHabit(h.id);
    expect(await listActiveHabits()).toEqual([]);
    expect(await listLogs()).toHaveLength(1);
  });

  it("toggles one log per habit per day", async () => {
    const h = await createHabit({ name: "a" });
    expect(await toggleLog(h.id, "2026-10-14")).toBe(true);
    expect(await toggleLog(h.id, "2026-10-14")).toBe(false);
    expect(await listLogs()).toHaveLength(0);
    await expect(toggleLog(h.id, "bad")).rejects.toThrow();
  });
});

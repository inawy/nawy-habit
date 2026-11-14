import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { NawyHabitDB, setDbForTests } from "./db";
import {
  archiveHabit,
  createHabit,
  listActiveHabits,
  listArchivedHabits,
  listTrashedHabits,
  listLogs,
  toggleLog,
  updateHabit,
  moveHabitToTrash,
  restoreFromTrash,
  permanentlyDeleteExpiredHabits,
  permanentlyDeleteHabit,
  reorderHabits,
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
    expect(habits[0]).toMatchObject({ icon: "auto_awesome", color: "blue" });
    await expect(createHabit({ name: "   " })).rejects.toThrow();
  });

  it("updates and archives without deleting history", async () => {
    const h = await createHabit({ name: "a" });
    await toggleLog(h.id, "2026-10-14");
    await updateHabit(h.id, { name: "b", emoji: "💧", icon: "water_drop", color: "teal" });
    expect(await db.habits.get(h.id)).toMatchObject({ icon: "water_drop", color: "teal" });
    await archiveHabit(h.id);
    expect(await listActiveHabits()).toEqual([]);
    expect(await listLogs()).toHaveLength(1);
  });

  it("keeps archive separate from trash and restores trashed habits", async () => {
    const h = await createHabit({ name: "قراءة" });
    await archiveHabit(h.id);
    expect(await listArchivedHabits()).toHaveLength(1);
    expect(await listTrashedHabits()).toHaveLength(0);
    await moveHabitToTrash(h.id);
    expect(await listArchivedHabits()).toHaveLength(0);
    expect(await listTrashedHabits()).toHaveLength(1);
    await restoreFromTrash(h.id);
    expect(await listArchivedHabits()).toHaveLength(1);
  });

  it("permanently removes trashed habits and their logs after 30 days", async () => {
    const h = await createHabit({ name: "مشي" });
    await toggleLog(h.id, "2026-10-14");
    const deletedAt = new Date("2026-10-01T12:00:00.000Z");
    await db.habits.update(h.id, { deletedAt: deletedAt.toISOString() });
    expect(await permanentlyDeleteExpiredHabits(new Date("2026-10-31T12:00:00.000Z"))).toBe(1);
    expect(await db.habits.get(h.id)).toBeUndefined();
    expect(await listLogs()).toHaveLength(0);
  });

  it("permanently deletes a habit and its history only when requested", async () => {
    const habit = await createHabit({ name: "قراءة" });
    await toggleLog(habit.id, "2026-10-14");

    await permanentlyDeleteHabit(habit.id);

    expect(await db.habits.get(habit.id)).toBeUndefined();
    expect(await listLogs()).toHaveLength(0);
  });

  it("toggles one log per habit per day", async () => {
    const h = await createHabit({ name: "a" });
    expect(await toggleLog(h.id, "2026-10-14")).toBe(true);
    expect(await toggleLog(h.id, "2026-10-14")).toBe(false);
    expect(await listLogs()).toHaveLength(0);
    await expect(toggleLog(h.id, "bad")).rejects.toThrow();
  });

  it("reorders active habits without touching archived ones", async () => {
    const a = await createHabit({ name: "أ" });
    const b = await createHabit({ name: "ب" });
    const archived = await createHabit({ name: "مؤرشفة" });
    const c = await createHabit({ name: "ج" });
    await archiveHabit(archived.id);

    await reorderHabits([c.id, a.id, b.id]);

    expect((await listActiveHabits()).map((h) => h.name)).toEqual(["ج", "أ", "ب"]);
    expect((await listArchivedHabits()).map((h) => h.id)).toEqual([archived.id]);
    expect((await db.habits.get(archived.id))?.order).toBe(archived.order);
  });

  it("rejects duplicate or unknown ids without changing the order", async () => {
    const a = await createHabit({ name: "أ" });
    const b = await createHabit({ name: "ب" });

    await expect(reorderHabits([a.id, a.id])).rejects.toThrow();
    await expect(reorderHabits([b.id, "missing"])).rejects.toThrow();
    expect((await listActiveHabits()).map((h) => h.name)).toEqual(["أ", "ب"]);
  });
});

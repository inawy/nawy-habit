import "fake-indexeddb/auto";
import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { exportBackup, importBackup, parseBackup } from "./backup-repo";
import { NawyHabitDB, setDbForTests } from "./db";
import { createHabit, listActiveHabits, listLogs, toggleLog } from "./habits-repo";

let db: NawyHabitDB;
beforeEach(() => {
  db = new NawyHabitDB(`test-${crypto.randomUUID()}`);
  setDbForTests(db);
});
afterEach(async () => {
  await db.delete();
  setDbForTests(null);
});

describe("backup", () => {
  it("round-trips export → import", async () => {
    const h = await createHabit({ name: "قراءة", emoji: "📖" });
    await toggleLog(h.id, "2026-10-14");
    const text = JSON.stringify(await exportBackup());
    await createHabit({ name: "زائدة" });
    await importBackup(parseBackup(text));
    expect((await listActiveHabits()).map((x) => x.name)).toEqual(["قراءة"]);
    expect(await listLogs()).toHaveLength(1);
  });

  it("rejects bad files with clear messages", () => {
    expect(() => parseBackup("not json")).toThrow("JSON");
    expect(() => parseBackup("{}")).toThrow("ليس نسخة");
    expect(() => parseBackup(JSON.stringify({ app: "nawy-habit", version: 99 }))).toThrow("أحدث");
    expect(() =>
      parseBackup(JSON.stringify({ app: "nawy-habit", version: 1, habits: [{}], logs: [] })),
    ).toThrow("تالفة");
  });

  it("drops logs of unknown habits", () => {
    const b = parseBackup(
      JSON.stringify({
        app: "nawy-habit",
        version: 1,
        exportedAt: "x",
        habits: [],
        logs: [{ id: "a:2026-10-14", habitId: "a", day: "2026-10-14", createdAt: "x" }],
      }),
    );
    expect(b.logs).toEqual([]);
  });
});

describe("database migrations", () => {
  it("opens data written by schema v1 without loss", async () => {
    const name = `mig-${crypto.randomUUID()}`;
    const old = new Dexie(name);
    old.version(1).stores({ habits: "id, order, archivedAt", logs: "id, habitId, day, [habitId+day]" });
    await old.table("habits").add({
      id: "h1", name: "مشي", emoji: "🚶", order: 0, createdAt: "x", archivedAt: null,
    });
    old.close();
    const current = new NawyHabitDB(name);
    expect(await current.habits.get("h1")).toMatchObject({ name: "مشي" });
    await current.delete();
  });
});

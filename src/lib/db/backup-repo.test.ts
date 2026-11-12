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

  it("upgrades v1 backups with default habit appearance", () => {
    const backup = parseBackup(
      JSON.stringify({
        app: "nawy-habit",
        version: 1,
        exportedAt: "2026-10-14T12:00:00.000Z",
        habits: [
          {
            id: "h1",
            name: "مشي",
            emoji: "🚶",
            order: 0,
            createdAt: "2026-10-14T12:00:00.000Z",
            archivedAt: null,
          },
        ],
        logs: [],
      }),
    );

    expect(backup.version).toBe(5);
    expect(backup.habits[0]).toMatchObject({ icon: "auto_awesome", color: "blue" });
  });

  it("replaces retired icons when importing v2 backups", () => {
    const backup = parseBackup(
      JSON.stringify({
        app: "nawy-habit",
        version: 2,
        exportedAt: "2026-10-14T12:00:00.000Z",
        habits: [
          {
            id: "saving",
            name: "ادخار",
            emoji: "✨",
            icon: "savings",
            color: "green",
            order: 0,
            createdAt: "2026-10-14T12:00:00.000Z",
            archivedAt: null,
          },
          {
            id: "giving",
            name: "عطاء",
            emoji: "✨",
            icon: "volunteer_activism",
            color: "blue",
            order: 1,
            createdAt: "2026-10-14T12:00:00.000Z",
            archivedAt: null,
          },
        ],
        logs: [],
      }),
    );

    expect(backup.version).toBe(4);
    expect(backup.habits.map((habit) => habit.icon)).toEqual([
      "account_balance_wallet",
      "volunteer_activism",
    ]);
  });

  it("upgrades v3 backups from gift to hand with heart for giving", () => {
    const backup = parseBackup(
      JSON.stringify({
        app: "nawy-habit",
        version: 3,
        exportedAt: "2026-10-14T12:00:00.000Z",
        habits: [
          {
            id: "giving",
            name: "عطاء",
            emoji: "✨",
            icon: "redeem",
            color: "blue",
            order: 0,
            createdAt: "2026-10-14T12:00:00.000Z",
            archivedAt: null,
          },
        ],
        logs: [],
      }),
    );

    expect(backup.version).toBe(4);
    expect(backup.habits[0]?.icon).toBe("volunteer_activism");
  });

  it("rejects logs of unknown habits without silently dropping them", () => {
    expect(() =>
      parseBackup(
        JSON.stringify({
          app: "nawy-habit",
          version: 4,
          exportedAt: "2026-10-14T12:00:00.000Z",
          habits: [],
          logs: [
            {
              id: "a:2026-10-14",
              habitId: "a",
              day: "2026-10-14",
              createdAt: "2026-10-14T12:00:00.000Z",
            },
          ],
        }),
      ),
    ).toThrow("غير موجودة");
  });

  it("rejects invalid timestamps", async () => {
    await createHabit({ name: "قراءة" });
    const backup = await exportBackup();
    expect(() => parseBackup(JSON.stringify({ ...backup, exportedAt: "not-a-date" }))).toThrow();
    const habit = backup.habits[0];
    expect(() =>
      parseBackup(JSON.stringify({ ...backup, habits: [{ ...habit, createdAt: "x" }] })),
    ).toThrow();
  });

  it("rejects duplicate habits", async () => {
    await createHabit({ name: "قراءة" });
    const backup = await exportBackup();
    expect(() =>
      parseBackup(JSON.stringify({ ...backup, habits: [...backup.habits, ...backup.habits] })),
    ).toThrow("عادات مكررة");
  });

  it("rejects duplicate logs", async () => {
    const h = await createHabit({ name: "قراءة" });
    await toggleLog(h.id, "2026-10-14");
    const backup = await exportBackup();
    expect(() =>
      parseBackup(JSON.stringify({ ...backup, logs: [...backup.logs, ...backup.logs] })),
    ).toThrow("تسجيلات مكررة");
  });

  it("rejects inconsistent log identifiers before replacing any data", async () => {
    const h = await createHabit({ name: "قراءة" });
    await toggleLog(h.id, "2026-10-14");
    const backup = await exportBackup();
    const invalid = { ...backup, logs: backup.logs.map((log) => ({ ...log, id: "wrong" })) };
    await expect(importBackup(invalid)).rejects.toThrow("غير متطابقة");
    expect(await exportBackup()).toMatchObject({ habits: backup.habits, logs: backup.logs });
  });

  it("rolls back replacement if storage fails after clearing data", async () => {
    const current = await createHabit({ name: "قراءة" });
    await toggleLog(current.id, "2026-10-14");
    const backup = await exportBackup();
    db.habits.hook("creating", () => {
      throw new Error("Storage failure");
    });
    await expect(importBackup(backup)).rejects.toThrow("Storage failure");
    expect(await listActiveHabits()).toEqual(backup.habits);
    expect(await listLogs()).toEqual(backup.logs);
  });
});

describe("database migrations", () => {
  it("replaces retired habit icons when migrating schema v2", async () => {
    const name = `mig-v2-${crypto.randomUUID()}`;
    const old = new Dexie(name);
    old.version(1).stores({
      habits: "id, order, archivedAt",
      logs: "id, habitId, day, [habitId+day]",
    });
    old.version(2).stores({
      habits: "id, order, archivedAt",
      logs: "id, habitId, day, [habitId+day]",
    });
    await old.table("habits").bulkAdd([
      {
        id: "saving",
        name: "ادخار",
        emoji: "✨",
        icon: "savings",
        color: "green",
        order: 0,
        createdAt: "x",
        archivedAt: null,
      },
      {
        id: "giving",
        name: "عطاء",
        emoji: "✨",
        icon: "volunteer_activism",
        color: "blue",
        order: 1,
        createdAt: "x",
        archivedAt: null,
      },
    ]);
    old.close();

    const current = new NawyHabitDB(name);
    const migrated = await current.habits.toArray();
    expect(migrated.find((habit) => habit.id === "saving")?.icon).toBe("account_balance_wallet");
    expect(migrated.find((habit) => habit.id === "giving")?.icon).toBe("volunteer_activism");
    await current.delete();
  });

  it("replaces gift icon with hand and heart when migrating schema v3", async () => {
    const name = `mig-v3-${crypto.randomUUID()}`;
    const old = new Dexie(name);
    old.version(1).stores({
      habits: "id, order, archivedAt",
      logs: "id, habitId, day, [habitId+day]",
    });
    old.version(2).stores({
      habits: "id, order, archivedAt",
      logs: "id, habitId, day, [habitId+day]",
    });
    old.version(3).stores({
      habits: "id, order, archivedAt",
      logs: "id, habitId, day, [habitId+day]",
    });
    await old.table("habits").add({
      id: "giving",
      name: "عطاء",
      emoji: "✨",
      icon: "redeem",
      color: "blue",
      order: 0,
      createdAt: "x",
      archivedAt: null,
    });
    old.close();

    const current = new NawyHabitDB(name);
    expect((await current.habits.get("giving"))?.icon).toBe("volunteer_activism");
    await current.delete();
  });

  it("opens data written by schema v1 without loss", async () => {
    const name = `mig-${crypto.randomUUID()}`;
    const old = new Dexie(name);
    old
      .version(1)
      .stores({ habits: "id, order, archivedAt", logs: "id, habitId, day, [habitId+day]" });
    await old.table("habits").add({
      id: "h1",
      name: "مشي",
      emoji: "🚶",
      order: 0,
      createdAt: "x",
      archivedAt: null,
    });
    old.close();
    const current = new NawyHabitDB(name);
    expect(await current.habits.get("h1")).toMatchObject({
      name: "مشي",
      icon: "auto_awesome",
      color: "blue",
    });
    await current.delete();
  });
});

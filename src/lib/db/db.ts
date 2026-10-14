import Dexie, { type EntityTable } from "dexie";

import type { Habit, HabitLog } from "./schema";

export const DB_NAME = "nawy-habit";

export class NawyHabitDB extends Dexie {
  habits!: EntityTable<Habit, "id">;
  logs!: EntityTable<HabitLog, "id">;

  constructor(name: string = DB_NAME) {
    super(name);
    // Schema history: never edit a released version — add version(n+1) with .upgrade().
    this.version(1).stores({
      habits: "id, order, archivedAt",
      logs: "id, habitId, day, [habitId+day]",
    });
  }
}

let instance: NawyHabitDB | null = null;

/** Lazily opens the browser database. Never call during SSR. */
export function getDb(): NawyHabitDB {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is not available in this environment");
  }
  instance ??= new NawyHabitDB();
  return instance;
}

/** Test helper: swap in an isolated database. */
export function setDbForTests(db: NawyHabitDB | null): void {
  instance = db;
}

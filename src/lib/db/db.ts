import Dexie, { type EntityTable } from "dexie";

import { DEFAULT_HABIT_COLOR, DEFAULT_HABIT_ICON } from "@/lib/habits/appearance";

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
    this.version(2)
      .stores({
        habits: "id, order, archivedAt",
        logs: "id, habitId, day, [habitId+day]",
      })
      .upgrade((tx) =>
        tx.table("habits").toCollection().modify((habit: Habit) => {
          if (!habit.icon) habit.icon = DEFAULT_HABIT_ICON;
          if (!habit.color) habit.color = DEFAULT_HABIT_COLOR;
        }),
      );
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

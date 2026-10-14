import type { DayKey } from "@/lib/date/day-key";

import { getDb } from "./db";
import {
  dayKeySchema,
  habitInputSchema,
  type Habit,
  type HabitInput,
  type HabitLog,
} from "./schema";

const newId = () => crypto.randomUUID();
const nowIso = () => new Date().toISOString();
export const logId = (habitId: string, day: DayKey) => `${habitId}:${day}`;

export async function listActiveHabits(): Promise<Habit[]> {
  const all = await getDb().habits.orderBy("order").toArray();
  return all.filter((h) => h.archivedAt === null);
}

export async function createHabit(input: HabitInput): Promise<Habit> {
  const data = habitInputSchema.parse(input);
  const db = getDb();
  return db.transaction("rw", db.habits, async () => {
    const last = await db.habits.orderBy("order").last();
    const habit: Habit = {
      id: newId(),
      name: data.name,
      emoji: data.emoji || "✨",
      order: (last?.order ?? -1) + 1,
      createdAt: nowIso(),
      archivedAt: null,
    };
    await db.habits.add(habit);
    return habit;
  });
}

export async function updateHabit(id: string, input: HabitInput): Promise<void> {
  const data = habitInputSchema.parse(input);
  await getDb().habits.update(id, { name: data.name, emoji: data.emoji || "✨" });
}

export async function archiveHabit(id: string): Promise<void> {
  await getDb().habits.update(id, { archivedAt: nowIso() });
}

export async function restoreHabit(id: string): Promise<void> {
  await getDb().habits.update(id, { archivedAt: null });
}

/** Toggles the check-in for a day. Returns true when the day is now done. */
export async function toggleLog(habitId: string, day: DayKey): Promise<boolean> {
  dayKeySchema.parse(day);
  const db = getDb();
  const id = logId(habitId, day);
  return db.transaction("rw", db.logs, async () => {
    if (await db.logs.get(id)) {
      await db.logs.delete(id);
      return false;
    }
    const log: HabitLog = { id, habitId, day, createdAt: nowIso() };
    await db.logs.add(log);
    return true;
  });
}

export async function listLogs(): Promise<HabitLog[]> {
  return getDb().logs.toArray();
}

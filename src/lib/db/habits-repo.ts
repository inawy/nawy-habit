import type { DayKey } from "@/lib/date/day-key";

import { getDb } from "./db";
import {
  dayKeySchema,
  habitInputSchema,
  type Habit,
  type HabitInput,
  type HabitLog,
} from "./schema";

export const TRASH_RETENTION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
const newId = () => crypto.randomUUID();
const nowIso = () => new Date().toISOString();
export const logId = (habitId: string, day: DayKey) => `${habitId}:${day}`;

export async function permanentlyDeleteExpiredHabits(now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - TRASH_RETENTION_DAYS * DAY_MS).toISOString();
  const db = getDb();
  return db.transaction("rw", db.habits, db.logs, async () => {
    const expired = await db.habits.where("deletedAt").belowOrEqual(cutoff).primaryKeys();
    if (!expired.length) return 0;
    await db.logs
      .where("habitId")
      .anyOf(expired as string[])
      .delete();
    await db.habits.bulkDelete(expired);
    return expired.length;
  });
}

export async function listActiveHabits(): Promise<Habit[]> {
  const all = await getDb().habits.orderBy("order").toArray();
  return all.filter((h) => h.archivedAt === null && h.deletedAt === null);
}

export async function listArchivedHabits(): Promise<Habit[]> {
  const all = await getDb().habits.orderBy("order").toArray();
  return all.filter((h) => h.archivedAt !== null && h.deletedAt === null);
}

export async function listTrashedHabits(): Promise<Habit[]> {
  const habits = await getDb().habits.where("deletedAt").above("").toArray();
  return habits.sort((a, b) => (b.deletedAt ?? "").localeCompare(a.deletedAt ?? ""));
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
      icon: data.icon,
      color: data.color,
      order: (last?.order ?? -1) + 1,
      createdAt: nowIso(),
      archivedAt: null,
      deletedAt: null,
    };
    await db.habits.add(habit);
    return habit;
  });
}

export async function updateHabit(id: string, input: HabitInput): Promise<void> {
  const data = habitInputSchema.parse(input);
  await getDb().habits.update(id, {
    name: data.name,
    emoji: data.emoji || "✨",
    icon: data.icon,
    color: data.color,
  });
}

export async function archiveHabit(id: string): Promise<void> {
  await getDb().habits.update(id, { archivedAt: nowIso() });
}

export async function restoreHabit(id: string): Promise<void> {
  await getDb().habits.update(id, { archivedAt: null });
}

export async function moveHabitToTrash(id: string): Promise<void> {
  await getDb().habits.update(id, { deletedAt: nowIso() });
}

export async function restoreFromTrash(id: string): Promise<void> {
  await getDb().habits.update(id, { deletedAt: null });
}

export async function permanentlyDeleteHabit(id: string): Promise<void> {
  const db = getDb();
  await db.transaction("rw", db.habits, db.logs, async () => {
    await db.logs.where("habitId").equals(id).delete();
    await db.habits.delete(id);
  });
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

export async function getHabit(id: string): Promise<Habit | undefined> {
  return getDb().habits.get(id);
}

/** Logs of one habit only — cheaper than filtering every log on the detail screen. */
export async function listLogsForHabit(habitId: string): Promise<HabitLog[]> {
  return getDb().logs.where("habitId").equals(habitId).toArray();
}

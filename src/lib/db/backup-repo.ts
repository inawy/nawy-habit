import { z } from "zod";

import { getDb } from "./db";
import { habitLogSchema, habitSchema } from "./schema";

/** Bump when the backup file shape changes; add a converter in `upgradeBackup`. */
export const BACKUP_VERSION = 1;
export const BACKUP_APP = "nawy-habit";

export const backupSchema = z.object({
  app: z.literal(BACKUP_APP),
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.string(),
  habits: z.array(habitSchema),
  logs: z.array(habitLogSchema),
});
export type Backup = z.infer<typeof backupSchema>;

export class BackupError extends Error {}

export async function exportBackup(): Promise<Backup> {
  const db = getDb();
  return db.transaction("r", db.habits, db.logs, async () => ({
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    habits: await db.habits.toArray(),
    logs: await db.logs.toArray(),
  }));
}

/** Converts older backup shapes to the current one. Only v1 exists today. */
function upgradeBackup(raw: unknown): unknown {
  return raw;
}

export function parseBackup(text: string): Backup {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new BackupError("الملف ليس بصيغة JSON صحيحة");
  }
  const obj = raw as { app?: unknown; version?: unknown } | null;
  if (!obj || obj.app !== BACKUP_APP) throw new BackupError("هذا الملف ليس نسخة من ناوي للعادات");
  if (typeof obj.version === "number" && obj.version > BACKUP_VERSION) {
    throw new BackupError("هذه النسخة من إصدار أحدث للتطبيق، حدّث التطبيق أولًا");
  }
  const result = backupSchema.safeParse(upgradeBackup(raw));
  if (!result.success) throw new BackupError("بيانات الملف ناقصة أو تالفة");
  const ids = new Set(result.data.habits.map((h) => h.id));
  return { ...result.data, logs: result.data.logs.filter((l) => ids.has(l.habitId)) };
}

/** Replaces all local data with the backup, atomically. */
export async function importBackup(backup: Backup): Promise<void> {
  const db = getDb();
  await db.transaction("rw", db.habits, db.logs, async () => {
    await db.logs.clear();
    await db.habits.clear();
    await db.habits.bulkAdd(backup.habits);
    await db.logs.bulkAdd(backup.logs);
  });
}

/** Asks the browser not to evict our data. Returns whether storage is persistent. */
export async function requestPersistentStorage(): Promise<boolean | null> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) return null;
  if (await navigator.storage.persisted()) return true;
  return navigator.storage.persist();
}

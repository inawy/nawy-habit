import { z } from "zod";

import { DEFAULT_HABIT_COLOR, DEFAULT_HABIT_ICON } from "@/lib/habits/appearance";

import { getDb } from "./db";
import { habitLogSchema, habitSchema } from "./schema";

/** Bump when the backup file shape changes; add a converter in `upgradeBackup`. */
export const BACKUP_VERSION = 4;
export const BACKUP_APP = "nawy-habit";
const timestampSchema = z.string().datetime({ offset: true });

export const backupSchema = z.object({
  app: z.literal(BACKUP_APP),
  version: z.literal(BACKUP_VERSION),
  exportedAt: timestampSchema,
  habits: z.array(
    habitSchema.extend({ createdAt: timestampSchema, archivedAt: timestampSchema.nullable() }),
  ),
  logs: z.array(habitLogSchema.extend({ createdAt: timestampSchema })),
});
export type Backup = z.infer<typeof backupSchema>;

export class BackupError extends Error {}

export async function exportBackup(): Promise<Backup> {
  const db = getDb();
  const data = await db.transaction("r", db.habits, db.logs, async () => ({
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    habits: await db.habits.toArray(),
    logs: await db.logs.toArray(),
  }));
  return validateBackup(data);
}

/** Upgrades older backups, replacing the pig-shaped bank and restoring the hand-with-heart giving icon. */
function upgradeBackup(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null) return raw;
  const backup = raw as { version?: unknown; habits?: unknown };
  if (![1, 2, 3].includes(backup.version as number) || !Array.isArray(backup.habits)) {
    return raw;
  }

  return {
    ...backup,
    version: BACKUP_VERSION,
    habits: backup.habits.map((habit) => {
      if (typeof habit !== "object" || habit === null) return habit;
      const savedHabit = habit as Record<string, unknown>;
      const previousIcon = savedHabit["icon"];
      const icon =
        previousIcon === "savings"
          ? "account_balance_wallet"
          : previousIcon === "redeem"
            ? "volunteer_activism"
            : (previousIcon ?? DEFAULT_HABIT_ICON);

      return {
        ...savedHabit,
        icon,
        color: savedHabit["color"] ?? DEFAULT_HABIT_COLOR,
      };
    }),
  };
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
  return validateBackup(upgradeBackup(raw));
}

function validateBackup(raw: unknown): Backup {
  const result = backupSchema.safeParse(raw);
  if (!result.success) throw new BackupError("بيانات الملف ناقصة أو تالفة");
  const ids = new Set(result.data.habits.map((h) => h.id));
  if (ids.size !== result.data.habits.length) throw new BackupError("الملف يحتوي على عادات مكررة");
  const logIds = new Set<string>();
  for (const log of result.data.logs) {
    if (!ids.has(log.habitId)) throw new BackupError("الملف يحتوي على تسجيلات لعادات غير موجودة");
    if (log.id !== `${log.habitId}:${log.day}`)
      throw new BackupError("بيانات تسجيلات الملف غير متطابقة");
    if (logIds.has(log.id)) throw new BackupError("الملف يحتوي على تسجيلات مكررة");
    logIds.add(log.id);
  }
  return result.data;
}

/** Replaces all local data with the backup, atomically. */
export async function importBackup(backup: Backup): Promise<void> {
  const validated = validateBackup(backup);
  const db = getDb();
  await db.transaction("rw", db.habits, db.logs, async () => {
    await db.logs.clear();
    await db.habits.clear();
    await db.habits.bulkAdd(validated.habits);
    await db.logs.bulkAdd(validated.logs);
  });
}

/** Asks the browser not to evict our data. Returns whether storage is persistent. */
export async function requestPersistentStorage(): Promise<boolean | null> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) return null;
  if (await navigator.storage.persisted()) return true;
  return navigator.storage.persist();
}

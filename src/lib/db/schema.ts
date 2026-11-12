import { z } from "zod";

import { isDayKey } from "@/lib/date/day-key";
import {
  DEFAULT_HABIT_COLOR,
  DEFAULT_HABIT_ICON,
  HABIT_COLOR_NAMES,
  HABIT_ICON_NAMES,
} from "@/lib/habits/appearance";

export const dayKeySchema = z.string().refine(isDayKey, "Invalid day key");

export const habitSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(60),
  /** Legacy field retained for existing local data and older backups; not rendered. */
  emoji: z.string().max(8),
  icon: z.enum(HABIT_ICON_NAMES).default(DEFAULT_HABIT_ICON),
  color: z.enum(HABIT_COLOR_NAMES).default(DEFAULT_HABIT_COLOR),
  order: z.number().int(),
  createdAt: z.string(),
  archivedAt: z.string().nullable(),
});
export type Habit = z.infer<typeof habitSchema>;

export const habitLogSchema = z.object({
  /** `${habitId}:${day}` — one log per habit per day. */
  id: z.string().min(1),
  habitId: z.string().min(1),
  day: dayKeySchema,
  createdAt: z.string(),
});
export type HabitLog = z.infer<typeof habitLogSchema>;

export const habitInputSchema = z.object({
  name: z.string().trim().min(1, "اكتب اسم العادة").max(60, "الاسم طويل جدًا"),
  /** Kept for compatibility with existing saved records and v1 backups. */
  emoji: z.string().trim().max(8).default("✨"),
  icon: z.enum(HABIT_ICON_NAMES).default(DEFAULT_HABIT_ICON),
  color: z.enum(HABIT_COLOR_NAMES).default(DEFAULT_HABIT_COLOR),
});
export type HabitInput = z.input<typeof habitInputSchema>;

import { useLiveQuery } from "dexie-react-hooks";

import type { DayKey } from "@/lib/date/day-key";
import { getHabit, listLogsForHabit } from "@/lib/db/habits-repo";
import type { Habit } from "@/lib/db/schema";

export interface HabitDetailView {
  habit: Habit;
  days: Set<DayKey>;
}

/**
 * Live view of one habit with its completed days.
 * `undefined` while loading, `null` when the habit does not exist.
 */
export function useHabitDetailView(habitId: string): HabitDetailView | null | undefined {
  return useLiveQuery(async () => {
    const habit = await getHabit(habitId);
    if (!habit) return null;
    const logs = await listLogsForHabit(habitId);
    return { habit, days: new Set(logs.map((l) => l.day)) };
  }, [habitId]);
}

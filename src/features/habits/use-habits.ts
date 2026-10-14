import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";

import { todayKey, type DayKey } from "@/lib/date/day-key";
import { listActiveHabits, listLogs } from "@/lib/db/habits-repo";
import type { Habit } from "@/lib/db/schema";

export interface HabitsView {
  habits: Habit[];
  daysByHabit: Map<string, Set<DayKey>>;
}

/** Live view of active habits and their completed days. `undefined` while loading. */
export function useHabitsView(): HabitsView | undefined {
  return useLiveQuery(async () => {
    const [habits, logs] = await Promise.all([listActiveHabits(), listLogs()]);
    const daysByHabit = new Map<string, Set<DayKey>>();
    for (const log of logs) {
      const set = daysByHabit.get(log.habitId) ?? new Set<DayKey>();
      set.add(log.day);
      daysByHabit.set(log.habitId, set);
    }
    return { habits, daysByHabit };
  });
}

/** Current local day; refreshes when the tab regains focus after midnight. */
export function useToday(): DayKey | null {
  const [day, setDay] = useState<DayKey | null>(null);
  useEffect(() => {
    const update = () => setDay(todayKey());
    update();
    const id = setInterval(update, 60_000);
    window.addEventListener("focus", update);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", update);
    };
  }, []);
  return day;
}

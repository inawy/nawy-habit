import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useMemo, useRef, useState } from "react";

import { todayKey, type DayKey } from "@/lib/date/day-key";
import { listActiveHabits, listRecentLogsForHabits } from "@/lib/db/habits-repo";
import type { Habit } from "@/lib/db/schema";

export interface HabitsView {
  habits: Habit[];
  daysByHabit: Map<string, Set<DayKey>>;
}

function sameHabit(a: Habit, b: Habit): boolean {
  return (
    a.id === b.id &&
    a.name === b.name &&
    a.emoji === b.emoji &&
    a.icon === b.icon &&
    a.color === b.color &&
    a.order === b.order &&
    a.createdAt === b.createdAt &&
    a.archivedAt === b.archivedAt &&
    a.deletedAt === b.deletedAt
  );
}

function sameDays(a: Set<DayKey>, b: Set<DayKey>): boolean {
  return a.size === b.size && [...a].every((day) => b.has(day));
}

/**
 * Live view of active habits and their completed days.
 * Reuses unchanged references so one check-in does not force every card and
 * every 168-cell activity grid to render again.
 */
export function useHabitsView(): HabitsView | undefined {
  const result = useLiveQuery(async () => {
    const habits = await listActiveHabits();
    const { logs, totalsByHabit } = await listRecentLogsForHabits(
      habits.map((habit) => habit.id),
      todayKey(),
    );
    const daysByHabit = new Map<string, Set<DayKey>>();
    for (const log of logs) {
      const set = daysByHabit.get(log.habitId) ?? new Set<DayKey>();
      set.add(log.day);
      daysByHabit.set(log.habitId, set);
    }
    return { habits, daysByHabit, totalsByHabit };
  });

  const previousView = useRef<HabitsView | undefined>(undefined);

  return useMemo(() => {
    if (!result) return undefined;

    const previous = previousView.current;
    const previousHabits = new Map(previous?.habits.map((habit) => [habit.id, habit]));
    const nextHabits = result.habits.map((habit) => {
      const oldHabit = previousHabits.get(habit.id);
      return oldHabit && sameHabit(oldHabit, habit) ? oldHabit : habit;
    });
    const habits =
      previous &&
      nextHabits.length === previous.habits.length &&
      nextHabits.every((habit, index) => habit === previous.habits[index])
        ? previous.habits
        : nextHabits;

    const daysByHabit = new Map<string, Set<DayKey>>();
    for (const [habitId, days] of result.daysByHabit) {
      const oldDays = previous?.daysByHabit.get(habitId);
      daysByHabit.set(habitId, oldDays && sameDays(oldDays, days) ? oldDays : days);
    }
    const previousTotals = previous?.totalsByHabit;
    const totalsByHabit =
      previousTotals &&
      previousTotals.size === result.totalsByHabit.size &&
      [...result.totalsByHabit].every(([id, total]) => previousTotals.get(id) === total)
        ? previousTotals
        : result.totalsByHabit;
    const stableView = { habits, daysByHabit, totalsByHabit };
    previousView.current = stableView;
    return stableView;
  }, [result]);
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

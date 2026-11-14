import type { HabitColorName, HabitIconName } from "@/lib/habits/appearance";

export interface HabitSuggestion {
  name: string;
  icon: HabitIconName;
  color: HabitColorName;
}

/** One-tap starting points for the new-habit sheet. Everyday, faith-sensitive and figure-free. */
export const HABIT_SUGGESTIONS: readonly HabitSuggestion[] = [
  { name: "قراءة 10 صفحات", icon: "menu_book", color: "blue" },
  { name: "ورد القرآن", icon: "menu_book", color: "green" },
  { name: "أذكار الصباح", icon: "wb_twilight", color: "amber" },
  { name: "صلاة الفجر", icon: "mosque", color: "violet" },
  { name: "شرب الماء", icon: "water_drop", color: "teal" },
  { name: "رياضة", icon: "fitness_center", color: "orange" },
  { name: "نوم مبكر", icon: "bedtime", color: "slate" },
  { name: "صدقة", icon: "volunteer_activism", color: "rose" },
];

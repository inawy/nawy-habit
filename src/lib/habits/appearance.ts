/**
 * Curated, reviewed allowlist for habit identity icons.
 *
 * Keep this set to neutral everyday activities and objects. Do not add icons
 * depicting pork/pigs, alcohol, gambling, sexual content, nudity, occult
 * imagery, or anything otherwise inappropriate for Nawy's faith-sensitive
 * audience. Review the actual SVG artwork, not only its symbol name, before
 * adding a new entry. The Zod enum in the habit schema enforces this allowlist.
 */
export const HABIT_ICON_NAMES = [
  "auto_awesome",
  "menu_book",
  "water_drop",
  "directions_walk",
  "fitness_center",
  "self_improvement",
  "bedtime",
  "restaurant",
  "favorite",
  "school",
  "savings",
  "volunteer_activism",
] as const;

export type HabitIconName = (typeof HABIT_ICON_NAMES)[number];

export const HABIT_ICON_OPTIONS: readonly { value: HabitIconName; label: string }[] = [
  { value: "auto_awesome", label: "بداية" },
  { value: "menu_book", label: "قراءة" },
  { value: "water_drop", label: "مياه" },
  { value: "directions_walk", label: "مشي" },
  { value: "fitness_center", label: "رياضة" },
  { value: "self_improvement", label: "هدوء" },
  { value: "bedtime", label: "نوم" },
  { value: "restaurant", label: "غذاء" },
  { value: "favorite", label: "صحة" },
  { value: "school", label: "تعلّم" },
  { value: "savings", label: "ادخار" },
  { value: "volunteer_activism", label: "عطاء" },
];

export const HABIT_COLOR_NAMES = [
  "blue",
  "teal",
  "green",
  "orange",
  "rose",
  "violet",
  "amber",
  "slate",
] as const;

export type HabitColorName = (typeof HABIT_COLOR_NAMES)[number];

export const HABIT_COLOR_OPTIONS: readonly {
  value: HabitColorName;
  label: string;
  swatch: string;
}[] = [
  { value: "blue", label: "أزرق", swatch: "#3D7BFF" },
  { value: "teal", label: "فيروزي", swatch: "#0F9488" },
  { value: "green", label: "أخضر", swatch: "#239B56" },
  { value: "orange", label: "برتقالي", swatch: "#E36B3D" },
  { value: "rose", label: "وردي", swatch: "#D95082" },
  { value: "violet", label: "بنفسجي", swatch: "#8061D8" },
  { value: "amber", label: "ذهبي", swatch: "#C98218" },
  { value: "slate", label: "رمادي", swatch: "#64748B" },
];

export const DEFAULT_HABIT_ICON: HabitIconName = "auto_awesome";
export const DEFAULT_HABIT_COLOR: HabitColorName = "blue";

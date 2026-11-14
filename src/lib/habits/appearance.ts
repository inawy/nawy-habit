/**
 * Curated, reviewed allowlist for habit identity icons (filled Material Symbols, see
 * components/habit-icon.tsx). Existing identifiers must stay valid: saved habits and backups use them.
 *
 * Keep this set to neutral everyday activities and objects that suit a faith-sensitive audience
 * following Islamic principles. Do not add icons depicting pork/pigs, alcohol, gambling, sexual
 * content, nudity, occult imagery, symbols of other religions or practices (for example lotus or
 * meditation poses), or people and animals (including pictogram figures). Prefer objects, nature
 * and abstract marks. Review the actual SVG artwork, not only its symbol name, before adding a
 * new entry. The Zod enum in the habit schema enforces this allowlist.
 */
export const HABIT_PICKER_ICON_NAMES = [
  "auto_awesome",
  "mosque",
  "menu_book",
  "water_drop",
  "wb_twilight",
  "wb_sunny",
  "alarm",
  "bedtime",
  "footprint",
  "pedal_bike",
  "waves",
  "sports_soccer",
  "fitness_center",
  "favorite",
  "monitor_heart",
  "nutrition",
  "restaurant",
  "medication",
  "clean_hands",
  "dentistry",
  "shower",
  "school",
  "edit_note",
  "translate",
  "code",
  "work",
  "timer",
  "lightbulb",
  "task_alt",
  "emoji_events",
  "palette",
  "eco",
  "cleaning_services",
  "family_home",
  "call",
  "account_balance_wallet",
  "volunteer_activism",
] as const;

/**
 * Retired from the picker (they depict a human figure) but still valid and rendered, so habits and
 * backups saved with them keep working.
 */
export const LEGACY_HABIT_ICON_NAMES = ["directions_walk", "self_improvement"] as const;

/** Figure-free replacements used when migrating stored habits and importing older backups. */
export const LEGACY_HABIT_ICON_REPLACEMENTS = {
  directions_walk: "footprint",
  self_improvement: "eco",
} as const satisfies Record<(typeof LEGACY_HABIT_ICON_NAMES)[number], string>;

/** Maps a retired icon identifier to its replacement; any other value is returned unchanged. */
export function replaceLegacyHabitIcon<T>(icon: T): T | string {
  if (typeof icon === "string" && Object.hasOwn(LEGACY_HABIT_ICON_REPLACEMENTS, icon)) {
    return LEGACY_HABIT_ICON_REPLACEMENTS[icon as keyof typeof LEGACY_HABIT_ICON_REPLACEMENTS];
  }
  return icon;
}

export const HABIT_ICON_NAMES = [...HABIT_PICKER_ICON_NAMES, ...LEGACY_HABIT_ICON_NAMES] as const;

export type HabitIconName = (typeof HABIT_ICON_NAMES)[number];

export const HABIT_ICON_OPTIONS: readonly { value: HabitIconName; label: string }[] = [
  { value: "auto_awesome", label: "بداية" },
  { value: "mosque", label: "صلاة" },
  { value: "menu_book", label: "قراءة" },
  { value: "water_drop", label: "مياه" },
  { value: "wb_twilight", label: "أذكار" },
  { value: "wb_sunny", label: "صباح" },
  { value: "alarm", label: "استيقاظ" },
  { value: "bedtime", label: "نوم" },
  { value: "footprint", label: "خطوات" },
  { value: "pedal_bike", label: "دراجة" },
  { value: "waves", label: "سباحة" },
  { value: "sports_soccer", label: "كرة" },
  { value: "fitness_center", label: "رياضة" },
  { value: "favorite", label: "صحة" },
  { value: "monitor_heart", label: "قلب" },
  { value: "nutrition", label: "تغذية" },
  { value: "restaurant", label: "غذاء" },
  { value: "medication", label: "دواء" },
  { value: "clean_hands", label: "نظافة" },
  { value: "dentistry", label: "أسنان" },
  { value: "shower", label: "استحمام" },
  { value: "school", label: "تعلّم" },
  { value: "edit_note", label: "كتابة" },
  { value: "translate", label: "لغة" },
  { value: "code", label: "برمجة" },
  { value: "work", label: "عمل" },
  { value: "timer", label: "تركيز" },
  { value: "lightbulb", label: "أفكار" },
  { value: "task_alt", label: "مهام" },
  { value: "emoji_events", label: "إنجاز" },
  { value: "palette", label: "فن" },
  { value: "eco", label: "طبيعة" },
  { value: "cleaning_services", label: "ترتيب" },
  { value: "family_home", label: "عائلة" },
  { value: "call", label: "تواصل" },
  { value: "account_balance_wallet", label: "ادخار" },
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

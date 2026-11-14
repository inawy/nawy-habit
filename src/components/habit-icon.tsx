import { DEFAULT_HABIT_ICON, type HabitIconName } from "@/lib/habits/appearance";
import { cn } from "@/lib/utils";

/**
 * Habit identity symbols use the filled Material Symbols variant: heavier shapes stay readable
 * and vivid on the tinted identity tile. UI controls keep the outlined set in `icon.tsx`.
 * Every file in `assets/icons/habit` must match an entry in HABIT_ICON_NAMES.
 */
const habitIcons = import.meta.glob<string>("../assets/icons/habit/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});

function habitIconSource(name: HabitIconName): string {
  const source =
    habitIcons[`../assets/icons/habit/${name}.svg`] ??
    habitIcons[`../assets/icons/habit/${DEFAULT_HABIT_ICON}.svg`];
  return source ?? "";
}

export function HabitIcon({ name, className }: { name: HabitIconName; className?: string }) {
  const mask = `url("${habitIconSource(name)}")`;

  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-5 shrink-0 bg-current", className)}
      style={{
        maskImage: mask,
        WebkitMaskImage: mask,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
        maskSize: "contain",
        WebkitMaskSize: "contain",
      }}
    />
  );
}

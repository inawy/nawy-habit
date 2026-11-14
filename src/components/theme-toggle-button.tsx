import { Icon } from "@/components/icon";
import { useTheme } from "@/lib/theme/theme-context";

/**
 * One-tap light/dark switch for the header. It always sets an explicit theme (the "follow the
 * system" option stays available in Settings) and shows the mode the tap will switch to.
 */
export function ThemeToggleButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const label = dark ? "التبديل إلى الوضع النهاري" : "التبديل إلى الوضع الليلي";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={label}
      title={label}
      className="habit-toolbar-action grid size-10 place-items-center rounded-full border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Icon name={dark ? "light_mode" : "bedtime"} className="size-5" />
    </button>
  );
}

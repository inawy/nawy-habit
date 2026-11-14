import type { OverviewMode } from "@/features/habits/habit-overview";

/** v3: v2 was cleared on purpose when the card grid was restored, so it is never read again. */
const STORAGE_KEY = "nawy-habit-overview-mode-v3";
const LEGACY_KEYS = ["nawy-habit-overview-mode-v2"];
const MODES: readonly OverviewMode[] = ["cards", "checklist", "compact"];

export function parseOverviewMode(value: unknown): OverviewMode | null {
  return MODES.find((mode) => mode === value) ?? null;
}

/** Storage can be blocked or throw (private windows, site data off): fall back to the default. */
export function readOverviewMode(): OverviewMode | null {
  try {
    for (const key of LEGACY_KEYS) window.localStorage.removeItem(key);
    return parseOverviewMode(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function saveOverviewMode(mode: OverviewMode): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // The choice still applies for this session.
  }
}

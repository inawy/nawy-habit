import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  HABIT_ICON_NAMES,
  HABIT_ICON_OPTIONS,
  HABIT_PICKER_ICON_NAMES,
  LEGACY_HABIT_ICON_NAMES,
} from "./appearance";

const habitIconDir = new URL("../../assets/icons/habit/", import.meta.url);

describe("habit icon allowlist", () => {
  it("has a vendored SVG for every allowed icon and no unlisted files", () => {
    const files = readdirSync(habitIconDir)
      .filter((file) => file.endsWith(".svg"))
      .map((file) => file.replace(/\.svg$/, ""))
      .sort();
    expect(files).toEqual([...HABIT_ICON_NAMES].sort());
  });

  it("offers every picker icon exactly once with a label, and hides legacy ones", () => {
    expect(HABIT_ICON_OPTIONS.map((option) => option.value).sort()).toEqual(
      [...HABIT_PICKER_ICON_NAMES].sort(),
    );
    for (const legacy of LEGACY_HABIT_ICON_NAMES) {
      expect(HABIT_ICON_OPTIONS.some((option) => option.value === legacy)).toBe(false);
    }
    expect(new Set(HABIT_ICON_OPTIONS.map((option) => option.label)).size).toBe(
      HABIT_ICON_OPTIONS.length,
    );
  });

  it("does not offer icons that depict people or other faiths' symbols", () => {
    const banned = [
      "directions_walk",
      "directions_run",
      "directions_bike",
      "pool",
      "self_improvement",
      "spa",
      "sports_gymnastics",
      "person",
    ];
    for (const name of banned) {
      expect(HABIT_PICKER_ICON_NAMES as readonly string[]).not.toContain(name);
    }
  });

  it("keeps every identifier that earlier versions could have saved", () => {
    for (const legacy of [
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
      "account_balance_wallet",
      "volunteer_activism",
    ]) {
      expect(HABIT_ICON_NAMES).toContain(legacy);
    }
  });
});

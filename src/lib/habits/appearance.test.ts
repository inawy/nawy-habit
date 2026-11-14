import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { HABIT_ICON_NAMES, HABIT_ICON_OPTIONS } from "./appearance";

const habitIconDir = new URL("../../assets/icons/habit/", import.meta.url);

describe("habit icon allowlist", () => {
  it("has a vendored SVG for every allowed icon and no unlisted files", () => {
    const files = readdirSync(habitIconDir)
      .filter((file) => file.endsWith(".svg"))
      .map((file) => file.replace(/\.svg$/, ""))
      .sort();
    expect(files).toEqual([...HABIT_ICON_NAMES].sort());
  });

  it("offers every allowed icon exactly once with an Arabic label", () => {
    expect(HABIT_ICON_OPTIONS.map((option) => option.value).sort()).toEqual(
      [...HABIT_ICON_NAMES].sort(),
    );
    expect(new Set(HABIT_ICON_OPTIONS.map((option) => option.label)).size).toBe(
      HABIT_ICON_OPTIONS.length,
    );
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

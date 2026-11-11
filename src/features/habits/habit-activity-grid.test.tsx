import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { addDays, type DayKey } from "@/lib/date/day-key";

import { HabitActivityGrid } from "./habit-activity-grid";

describe("HabitActivityGrid compact overview", () => {
  it("shows exactly the latest 28 days and highlights completed days", () => {
    const today = "2026-11-11" as DayKey;
    const completedDays = new Set<DayKey>([today, addDays(today, -3), addDays(today, -16)]);

    const { container } = render(
      <HabitActivityGrid days={completedDays} today={today} compact />,
    );

    const grid = container.querySelector(".habit-heatmap-grid");
    expect(grid?.children).toHaveLength(28);
    expect(grid?.querySelectorAll(".is-complete")).toHaveLength(3);
    expect(grid?.querySelectorAll(".is-today")).toHaveLength(1);
  });
});

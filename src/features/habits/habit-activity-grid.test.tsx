import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { addDays, type DayKey } from "@/lib/date/day-key";

import { HabitActivityGrid } from "./habit-activity-grid";

describe("HabitActivityGrid compact overview", () => {
  it("shows a 24-week x 7-day window and highlights completed days", () => {
    const today = "2026-11-11" as DayKey;
    const completedDays = new Set<DayKey>([today, addDays(today, -3), addDays(today, -16)]);

    const { container } = render(<HabitActivityGrid days={completedDays} today={today} compact />);

    const grid = container.querySelector(".habit-heatmap-grid");
    expect(grid?.children).toHaveLength(24 * 7);
    expect(grid?.querySelectorAll(".is-complete")).toHaveLength(3);
    expect(grid?.querySelectorAll(".is-today")).toHaveLength(1);
    // 2026-11-11 is a Wednesday: Thursday-Sunday of the current week are future cells.
    expect(grid?.querySelectorAll(".is-future")).toHaveLength(4);
  });

  it("ignores completed days older than the 24-week window", () => {
    const today = "2026-11-11" as DayKey;
    const completedDays = new Set<DayKey>([addDays(today, -400)]);

    const { container } = render(<HabitActivityGrid days={completedDays} today={today} compact />);

    expect(container.querySelectorAll(".habit-heatmap-grid .is-complete")).toHaveLength(0);
  });

  it("rebuilds the shared layout when the day changes", () => {
    const first = "2026-11-11" as DayKey;
    const second = "2026-11-12" as DayKey;

    const { container, rerender } = render(
      <HabitActivityGrid days={new Set()} today={first} compact />,
    );
    const todayTitle = () => container.querySelector(".is-today")?.getAttribute("title");
    const before = todayTitle();

    rerender(<HabitActivityGrid days={new Set([second])} today={second} compact />);

    expect(container.querySelectorAll(".is-today")).toHaveLength(1);
    expect(container.querySelectorAll(".is-complete")).toHaveLength(1);
    expect(todayTitle()).not.toBe(before);
    expect(todayTitle()).toContain("اليوم");
  });

  it("gives every card the same layout while keeping each card's own completions", () => {
    const today = "2026-11-11" as DayKey;
    const a = render(<HabitActivityGrid days={new Set([today])} today={today} compact />);
    const b = render(<HabitActivityGrid days={new Set()} today={today} compact />);

    expect(a.container.querySelectorAll(".is-complete")).toHaveLength(1);
    expect(b.container.querySelectorAll(".is-complete")).toHaveLength(0);
    expect(a.container.querySelectorAll("li")).toHaveLength(
      b.container.querySelectorAll("li").length,
    );
  });
});

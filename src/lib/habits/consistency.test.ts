import { describe, expect, it } from "vitest";

import { lastWeeks, monthProgress } from "./consistency";

describe("monthProgress", () => {
  it("counts only days from habit creation", () => {
    expect(monthProgress(["2026-10-01", "2026-10-12", "2026-10-14", "2026-10-15"], "2026-10", "2026-10-14", "2026-10-12"))
      .toEqual({ month: "2026-10", done: 2, elapsed: 3, rate: 2 / 3 });
  });
  it("has no rate for a month before habit creation", () => {
    expect(monthProgress(["2026-09-30"], "2026-09", "2026-10-14", "2026-10-12"))
      .toEqual({ month: "2026-09", done: 0, elapsed: 0, rate: null });
  });
  it("counts the creation day as one eligible day", () => {
    expect(monthProgress(["2026-10-14"], "2026-10", "2026-10-14", "2026-10-14").rate).toBe(1);
  });
  it("uses valid unique calendar days only", () => {
    expect(monthProgress(["2026-02-28", "2026-02-28", "2026-02-30"], "2026-02", "2026-03-01", "2026-02-27"))
      .toEqual({ month: "2026-02", done: 1, elapsed: 2, rate: 0.5 });
  });
  it("counts a past month over all its days", () => {
    const days = ["2026-09-01", "2026-09-02", "2026-09-03"];
    expect(monthProgress(days, "2026-09", "2026-10-14")).toEqual({
      month: "2026-09",
      done: 3,
      elapsed: 30,
      rate: 0.1,
    });
  });

  it("counts the current month only up to today", () => {
    const days = ["2026-10-01", "2026-10-14", "2026-10-15"];
    expect(monthProgress(days, "2026-10", "2026-10-14")).toEqual({
      month: "2026-10",
      done: 2,
      elapsed: 14,
      rate: 2 / 14,
    });
  });

  it("has no rate for a month that has not started", () => {
    expect(monthProgress(["2026-11-01"], "2026-11", "2026-10-14")).toEqual({
      month: "2026-11",
      done: 0,
      elapsed: 0,
      rate: null,
    });
  });
});

describe("lastWeeks", () => {
  it("splits the recent stretch into oldest-first weeks", () => {
    const weeks = lastWeeks(["2026-10-14", "2026-10-13"], "2026-10-14", 2);
    expect(weeks).toHaveLength(2);
    expect(weeks[0]?.weekStart).toBe("2026-10-01");
    expect(weeks[0]?.done).toBe(0);
    expect(weeks[1]?.weekStart).toBe("2026-10-08");
    expect(weeks[1]?.days).toHaveLength(7);
    expect(weeks[1]?.days.at(-1)).toBe("2026-10-14");
    expect(weeks[1]?.done).toBe(2);
  });
});

import { describe, expect, it } from "vitest";

import {
  addMonths,
  daysInMonth,
  firstDayOfMonth,
  isMonthKey,
  monthDays,
  monthGrid,
  toMonthKey,
  weekDays,
} from "./month";

describe("month", () => {
  it("derives and validates month keys", () => {
    expect(toMonthKey("2026-10-14")).toBe("2026-10");
    expect(isMonthKey("2026-10")).toBe(true);
    expect(isMonthKey("2026-13")).toBe(false);
    expect(isMonthKey("2026-1")).toBe(false);
  });

  it("counts days and adds months across the year", () => {
    expect(daysInMonth("2026-02")).toBe(28);
    expect(daysInMonth("2028-02")).toBe(29);
    expect(daysInMonth("2026-12")).toBe(31);
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
    expect(addMonths("2026-10", 0)).toBe("2026-10");
  });

  it("lists the days of a month oldest first", () => {
    const days = monthDays("2026-02");
    expect(days).toHaveLength(28);
    expect(days[0]).toBe("2026-02-01");
    expect(days.at(-1)).toBe("2026-02-28");
  });

  it("builds a full-week grid starting on Saturday", () => {
    const grid = monthGrid("2026-10");
    expect(grid.length % 7).toBe(0);
    // 1 Oct 2026 is a Thursday, so Sat–Wed come before it in the first week.
    expect(grid.slice(0, 5)).toEqual([null, null, null, null, null]);
    expect(grid[5]).toBe("2026-10-01");
    // 31 Oct 2026 is a Saturday: it opens the last week on its own.
    expect(grid[35]).toBe("2026-10-31");
    expect(grid.slice(36)).toEqual([null, null, null, null, null, null]);
  });

  it("pads a month that starts on the week's first day", () => {
    const grid = monthGrid("2026-08");
    expect(grid[0]).toBe("2026-08-01");
    expect(grid.length % 7).toBe(0);
  });

  it("orders a week from its first weekday", () => {
    // 14 Oct 2026 is a Wednesday; the Saturday-first week runs 10 → 16 Oct.
    expect(weekDays("2026-10-14")).toEqual([
      "2026-10-10",
      "2026-10-11",
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
      "2026-10-15",
      "2026-10-16",
    ]);
  });

  it("keeps the first day of the month inside the month", () => {
    expect(firstDayOfMonth("2026-10")).toBe("2026-10-01");
  });
});

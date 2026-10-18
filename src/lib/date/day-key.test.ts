import { describe, expect, it } from "vitest";

import { addDays, isDayKey, lastDays, toDayKey } from "./day-key";

describe("day-key", () => {
  it("formats local dates", () => {
    expect(toDayKey(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });
  it("validates keys", () => {
    expect(isDayKey("2026-02-30")).toBe(false);
    expect(isDayKey("2026-2-3")).toBe(false);
    expect(isDayKey("2026-10-14")).toBe(true);
  });
  it("lists last days oldest first", () => {
    expect(lastDays("2026-03-02", 3)).toEqual(["2026-02-28", "2026-03-01", "2026-03-02"]);
  });
  it("provides 12 weeks of unique local days ending today across leap day", () => {
    const days = lastDays("2028-03-01", 84);
    expect(days).toHaveLength(84);
    expect(new Set(days).size).toBe(84);
    expect(days[0]).toBe("2027-12-09");
    expect(days.at(-1)).toBe("2028-03-01");
    expect(days).toContain("2028-02-29");
    expect(days.every((day) => day <= "2028-03-01")).toBe(true);
  });
});

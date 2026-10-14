import { describe, expect, it } from "vitest";

import { computeStreaks } from "./streak";

describe("computeStreaks", () => {
  it("is zero with no history", () => {
    expect(computeStreaks([], "2026-10-14")).toEqual({ current: 0, best: 0, total: 0 });
  });
  it("keeps the streak alive when today is not done yet", () => {
    const r = computeStreaks(["2026-10-12", "2026-10-13"], "2026-10-14");
    expect(r.current).toBe(2);
  });
  it("includes today when done", () => {
    expect(computeStreaks(["2026-10-13", "2026-10-14"], "2026-10-14").current).toBe(2);
  });
  it("resets current after a missed day but keeps best and total", () => {
    const r = computeStreaks(
      ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-12"],
      "2026-10-14",
    );
    expect(r).toEqual({ current: 0, best: 3, total: 4 });
  });
  it("ignores duplicates and order", () => {
    const r = computeStreaks(["2026-10-14", "2026-10-13", "2026-10-14"], "2026-10-14");
    expect(r).toEqual({ current: 2, best: 2, total: 2 });
  });
  it("handles month boundaries", () => {
    expect(computeStreaks(["2026-09-30", "2026-10-01"], "2026-10-01").current).toBe(2);
  });
});

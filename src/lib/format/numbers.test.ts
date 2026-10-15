import { describe, expect, it } from "vitest";

import { arabicFmt, num } from "./numbers";

describe("number formatting", () => {
  it("always uses Western digits", () => {
    expect(num(0)).toBe("0");
    expect(num(15)).toBe("15");
    expect(num(1234)).toBe("1,234");
  });

  it("keeps Western digits in dates", () => {
    const fmt = arabicFmt({ day: "numeric", month: "long", year: "numeric" });
    expect(fmt.format(new Date(2026, 9, 15, 12))).toContain("2026");
    expect(fmt.format(new Date(2026, 9, 15, 12))).toContain("15");
  });
});

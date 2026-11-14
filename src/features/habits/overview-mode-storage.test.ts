import { afterEach, describe, expect, it, vi } from "vitest";

import { parseOverviewMode, readOverviewMode, saveOverviewMode } from "./overview-mode-storage";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("overview mode storage", () => {
  it("accepts only known modes", () => {
    expect(parseOverviewMode("checklist")).toBe("checklist");
    expect(parseOverviewMode("grid")).toBeNull();
    expect(parseOverviewMode(null)).toBeNull();
  });

  it("saves and restores the chosen mode", () => {
    expect(readOverviewMode()).toBeNull();
    saveOverviewMode("compact");
    expect(readOverviewMode()).toBe("compact");
  });

  it("ignores a corrupt stored value and removes the legacy key", () => {
    window.localStorage.setItem("nawy-habit-overview-mode-v3", "nonsense");
    window.localStorage.setItem("nawy-habit-overview-mode-v2", "compact");
    expect(readOverviewMode()).toBeNull();
    expect(window.localStorage.getItem("nawy-habit-overview-mode-v2")).toBeNull();
  });

  it("does not throw when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readOverviewMode()).toBeNull();
    expect(() => saveOverviewMode("cards")).not.toThrow();
  });
});

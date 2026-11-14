import { afterEach, describe, expect, it, vi } from "vitest";

import { consumeSidebarReturn, hasPendingSidebarReturn, markSidebarReturn } from "./sidebar-return";

afterEach(() => {
  window.sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("sidebar return", () => {
  it("is not pending until a menu trip is marked", () => {
    expect(hasPendingSidebarReturn()).toBe(false);
    expect(consumeSidebarReturn()).toBe(false);
  });

  it("is consumed exactly once", () => {
    markSidebarReturn(1_000);
    expect(hasPendingSidebarReturn(2_000)).toBe(true);
    expect(consumeSidebarReturn(2_000)).toBe(true);
    expect(consumeSidebarReturn(2_000)).toBe(false);
  });

  it("expires after an hour", () => {
    markSidebarReturn(1_000);
    expect(consumeSidebarReturn(1_000 + 60 * 60 * 1000 + 1)).toBe(false);
  });

  it("does not throw when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => markSidebarReturn()).not.toThrow();
    expect(hasPendingSidebarReturn()).toBe(false);
  });
});

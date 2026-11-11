import { beforeEach, describe, expect, it, vi } from "vitest";

import { getTodayState, recordSlotSent } from "./reminders-store";
import { releaseSlot, tryClaimSlot } from "./slot-claim";

type LockCallback = (lock: { name: string } | null) => unknown;

/** Minimal Web Locks stand-in: one holder per name, the rest bail out or wait. */
function installFakeLocks() {
  const held = new Set<string>();
  const waiters = new Map<string, Array<() => void>>();

  const request = async (
    name: string,
    options: { ifAvailable?: boolean } | LockCallback,
    maybeCallback?: LockCallback,
  ) => {
    const callback = (typeof options === "function" ? options : maybeCallback) as LockCallback;
    const ifAvailable = typeof options === "object" && options !== null && options.ifAvailable;

    if (held.has(name)) {
      if (ifAvailable) return callback(null);
      await new Promise<void>((resolve) => {
        const queue = waiters.get(name) ?? [];
        queue.push(resolve);
        waiters.set(name, queue);
      });
    }

    held.add(name);
    try {
      return await callback({ name });
    } finally {
      held.delete(name);
      waiters.get(name)?.shift()?.();
    }
  };

  Object.defineProperty(navigator, "locks", {
    configurable: true,
    writable: true,
    value: { request },
  });
  return held;
}

function removeLocks() {
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    writable: true,
    value: undefined,
  });
}

describe("reminder slot claiming", () => {
  beforeEach(() => {
    window.localStorage.clear();
    installFakeLocks();
  });

  it("claims a slot nobody fired today and records it", async () => {
    await expect(tryClaimSlot("2026-10-19", 1)).resolves.toBe(true);
    expect(getTodayState("2026-10-19").sent).toEqual([1]);
  });

  it("refuses the same slot a second time in the same window", async () => {
    await expect(tryClaimSlot("2026-10-19", 1)).resolves.toBe(true);
    await expect(tryClaimSlot("2026-10-19", 1)).resolves.toBe(false);
    expect(getTodayState("2026-10-19").sent).toEqual([1]);
  });

  it("refuses a slot another window already recorded", async () => {
    recordSlotSent("2026-10-19", 0);
    await expect(tryClaimSlot("2026-10-19", 0)).resolves.toBe(false);
    expect(getTodayState("2026-10-19").sent).toEqual([0]);
  });

  it("gives the slot to exactly one window when both claim at the same instant", async () => {
    const results = await Promise.all([
      tryClaimSlot("2026-10-19", 2),
      tryClaimSlot("2026-10-19", 2),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(getTodayState("2026-10-19").sent).toEqual([2]);
  });

  it("lets a failed notification fire again after the slot is released", async () => {
    await expect(tryClaimSlot("2026-10-19", 0)).resolves.toBe(true);
    releaseSlot("2026-10-19", 0);
    expect(getTodayState("2026-10-19").sent).toEqual([]);
    await expect(tryClaimSlot("2026-10-19", 0)).resolves.toBe(true);
  });

  it("still claims when the browser has no Web Locks", async () => {
    removeLocks();
    await expect(tryClaimSlot("2026-10-19", 1)).resolves.toBe(true);
    expect(getTodayState("2026-10-19").sent).toEqual([1]);
    await expect(tryClaimSlot("2026-10-19", 1)).resolves.toBe(false);
  });

  it("does not claim when the lock request itself fails", async () => {
    Object.defineProperty(navigator, "locks", {
      configurable: true,
      writable: true,
      value: { request: vi.fn(() => Promise.reject(new Error("locks unavailable"))) },
    });
    await expect(tryClaimSlot("2026-10-19", 1)).resolves.toBe(false);
    expect(getTodayState("2026-10-19").sent).toEqual([]);
  });
});

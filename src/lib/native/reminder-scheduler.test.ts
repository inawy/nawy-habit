import { beforeEach, describe, expect, it, vi } from "vitest";

import { planNativeReminders } from "@/lib/reminders/native-plan";

import { createCapacitorScheduler } from "./reminder-scheduler";

// A stand-in for the real plugin. Like the real one it is a proxy that answers to ANY property,
// `then` included; here `then` throws so a regression (returning the plugin from an async
// function) fails loudly instead of silently never scheduling.
const state = vi.hoisted(() => ({
  pending: [] as { id: number }[],
  keep: Number.POSITIVE_INFINITY,
  permission: "prompt",
  calls: [] as string[],
  scheduled: [] as { id: number; isExactNotification?: boolean }[],
}));

vi.mock("@capacitor/local-notifications", () => {
  const api: Record<string, (arg?: unknown) => Promise<unknown>> = {
    checkPermissions: async () => ({ display: state.permission }),
    requestPermissions: async () => ({ display: "granted" }),
    getPending: async () => ({ notifications: [...state.pending] }),
    cancel: async () => {
      state.calls.push("cancel");
      state.pending = [];
    },
    createChannel: async () => {
      state.calls.push("createChannel");
    },
    schedule: async (arg?: unknown) => {
      state.calls.push("schedule");
      const list = (arg as { notifications: (typeof state.scheduled)[number][] }).notifications;
      state.scheduled = list;
      state.pending = list.slice(0, state.keep).map(({ id }) => ({ id }));
    },
  };
  const LocalNotifications = new Proxy(api, {
    get(target, prop: string) {
      if (prop === "then") throw new Error("X.then() is not implemented on android");
      return target[prop];
    },
  });
  return { LocalNotifications };
});

describe("Capacitor reminder scheduler", () => {
  beforeEach(() => {
    state.pending = [];
    state.keep = Number.POSITIVE_INFINITY;
    state.permission = "prompt";
    state.calls = [];
    state.scheduled = [];
  });

  const plan = planNativeReminders(new Date(2026, 10, 20, 8, 0), 2, 5);

  it("loads the plugin without tripping over its proxy `then`", async () => {
    await expect(createCapacitorScheduler().pendingCount()).resolves.toBe(0);
  });

  it("maps permission states, treating prompts as not yet decided", async () => {
    const scheduler = createCapacitorScheduler();
    expect(await scheduler.checkPermission()).toBe("default");
    state.permission = "denied";
    expect(await scheduler.checkPermission()).toBe("denied");
    expect(await scheduler.requestPermission()).toBe("granted");
  });

  it("replaces what was scheduled instead of adding to it", async () => {
    const scheduler = createCapacitorScheduler();
    await scheduler.replaceAll(plan);
    await scheduler.replaceAll(plan);
    expect(await scheduler.pendingCount()).toBe(plan.length);
    expect(state.calls.filter((c) => c === "cancel")).toHaveLength(1);
  });

  it("never asks for exact alarms, which would open system settings instead of scheduling", async () => {
    await createCapacitorScheduler().replaceAll(plan);
    expect(state.scheduled).toHaveLength(plan.length);
    expect(state.scheduled.every((n) => n.isExactNotification === false)).toBe(true);
  });

  it("schedules nothing, and cancels the old ones, for an empty plan", async () => {
    const scheduler = createCapacitorScheduler();
    await scheduler.replaceAll(plan);
    await scheduler.replaceAll([]);
    expect(await scheduler.pendingCount()).toBe(0);
  });

  it("throws, instead of staying silent, when the phone keeps fewer than asked", async () => {
    state.keep = 1;
    await expect(createCapacitorScheduler().replaceAll(plan)).rejects.toThrow(/1 من 3/);
  });
});

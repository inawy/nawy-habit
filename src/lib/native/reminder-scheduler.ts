import {
  NATIVE_CHANNEL_ID,
  NATIVE_REMINDER_BODY,
  NATIVE_REMINDER_TITLE,
  type PlannedReminder,
} from "@/lib/reminders/native-plan";

export type NativePermission = "granted" | "denied" | "default";

/** What the UI knows about phone reminders. The UI never imports Capacitor directly. */
export interface ReminderScheduler {
  checkPermission(): Promise<NativePermission>;
  requestPermission(): Promise<NativePermission>;
  /** Cancels everything this app scheduled, then schedules `plan`. Throws if the phone refused. */
  replaceAll(plan: readonly PlannedReminder[]): Promise<void>;
  pendingCount(): Promise<number>;
  /** Shows one notification right now, to prove the whole path works on this phone. */
  showTest(): Promise<void>;
}

const TEST_NOTIFICATION_ID = 99;
export const TEST_NOTIFICATION_TITLE = "تجربة عادة";

type LocalNotifications = typeof import("@capacitor/local-notifications").LocalNotifications;

/**
 * Loads the plugin only inside the app. The plugin object is a proxy that answers to *any*
 * property, including `then`. Returning it straight from an async function makes the promise
 * machinery call `then()` on it and fail with "X.then() is not implemented on android", so it is
 * wrapped in a plain object and unwrapped by the caller. The test in reminder-scheduler.test.ts
 * keeps this from regressing.
 */
async function loadPlugin(): Promise<{ notifications: LocalNotifications }> {
  const loaded = await import("@capacitor/local-notifications");
  return { notifications: loaded.LocalNotifications };
}

function toPermission(display: string): NativePermission {
  if (display === "granted") return "granted";
  if (display === "denied") return "denied";
  return "default";
}

export function createCapacitorScheduler(): ReminderScheduler {
  return {
    async checkPermission() {
      const { notifications } = await loadPlugin();
      return toPermission((await notifications.checkPermissions()).display);
    },

    async requestPermission() {
      const { notifications } = await loadPlugin();
      return toPermission((await notifications.requestPermissions()).display);
    },

    async replaceAll(plan) {
      const { notifications } = await loadPlugin();
      const existing = await notifications.getPending();
      if (existing.notifications.length > 0) {
        await notifications.cancel({
          notifications: existing.notifications.map(({ id }) => ({ id })),
        });
      }
      if (plan.length === 0) return;
      await notifications.createChannel({
        id: NATIVE_CHANNEL_ID,
        name: "التذكير اليومي",
        description: "تنبيهات يومية بمواعيد ثابتة للعادات اللي لسه ما اتسجلتش",
        importance: 4,
      });
      await notifications.schedule({
        notifications: plan.map((reminder) => ({
          id: reminder.id,
          title: NATIVE_REMINDER_TITLE,
          body: NATIVE_REMINDER_BODY,
          channelId: NATIVE_CHANNEL_ID,
          // No `allowWhileIdle`: it makes the plugin ask for the exact-alarm permission and, without
          // it, send the person to system settings and schedule nothing (seen on the emulator).
          // Inexact daily alarms need no special permission, at the price of Doze delaying them.
          schedule: { at: reminder.at, every: "day" },
        })),
      });
      // The phone can accept the call and still keep nothing, so ask what it really kept.
      const kept = (await notifications.getPending()).notifications.length;
      if (kept < plan.length) {
        throw new Error(`الهاتف جدول ${kept} من ${plan.length} تذكيرات فقط`);
      }
    },

    async pendingCount() {
      const { notifications } = await loadPlugin();
      return (await notifications.getPending()).notifications.length;
    },

    async showTest() {
      const { notifications } = await loadPlugin();
      await notifications.createChannel({
        id: NATIVE_CHANNEL_ID,
        name: "التذكير اليومي",
        description: "تنبيهات يومية بمواعيد ثابتة للعادات اللي لسه ما اتسجلتش",
        importance: 4,
      });
      await notifications.schedule({
        notifications: [
          {
            id: TEST_NOTIFICATION_ID,
            title: TEST_NOTIFICATION_TITLE,
            body: "لو شفت الإشعار ده، التذكيرات شغالة على هاتفك.",
            channelId: NATIVE_CHANNEL_ID,
          },
        ],
      });
    },
  };
}

let scheduler: ReminderScheduler | null = null;

/** The app's single scheduler. Tests replace it with a fake through `setReminderScheduler`. */
export function getReminderScheduler(): ReminderScheduler {
  scheduler ??= createCapacitorScheduler();
  return scheduler;
}

export function setReminderScheduler(next: ReminderScheduler | null): void {
  scheduler = next;
}

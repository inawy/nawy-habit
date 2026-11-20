import { useCallback, useEffect, useRef, useState } from "react";

import { isNativeApp } from "@/lib/native/platform";
import { getReminderScheduler } from "@/lib/native/reminder-scheduler";
import { planNativeReminders } from "@/lib/reminders/native-plan";
import { dueSlot } from "@/lib/reminders/slots";
import { getTodayState } from "@/lib/reminders/reminders-store";
import { releaseSlot, tryClaimSlot } from "@/lib/reminders/slot-claim";
import { showHabitReminder } from "@/lib/reminders/notify";

export type ReminderPermission = "granted" | "denied" | "default";

/**
 * Daily reminders, local-only, at most 3 fixed slots per day.
 *
 * In a browser a page timer fires them while the page is visible and active; it is not a
 * background alarm and never runs after the app or browser has been closed. Slots are claimed
 * through the Web Locks API, so windows open at the same time never double-fire.
 *
 * Inside the Android app the same fixed slots are handed to the phone as repeating alarms, so
 * they ring with the app closed. `syncError` carries the phone's own message when that fails.
 */
export function useReminders(today: string | null, unfinished: number | null) {
  const [permission, setPermission] = useState<ReminderPermission | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    if (isNativeApp()) {
      getReminderScheduler()
        .checkPermission()
        .then(setPermission)
        .catch((error: unknown) => setSyncError(messageOf(error)));
      return;
    }
    if (typeof Notification === "undefined") return;
    setPermission(Notification.permission);
  }, []);

  const request = useCallback(async (): Promise<ReminderPermission> => {
    if (isNativeApp()) {
      try {
        const result = await getReminderScheduler().requestPermission();
        setPermission(result);
        return result;
      } catch (error) {
        setSyncError(messageOf(error));
        return "denied";
      }
    }
    if (typeof Notification === "undefined") return "denied";
    const result = (await Notification.requestPermission()) as ReminderPermission;
    setPermission(result);
    return result;
  }, []);

  // Android app: keep the phone's alarms in step with what is left to do today.
  useEffect(() => {
    if (!isNativeApp() || unfinished === null || permission !== "granted") return;
    let cancelled = false;
    getReminderScheduler()
      .replaceAll(planNativeReminders(new Date(), unfinished))
      .then(() => {
        if (!cancelled) setSyncError(null);
      })
      .catch((error: unknown) => {
        console.error(error);
        if (!cancelled) setSyncError(messageOf(error));
      });
    return () => {
      cancelled = true;
    };
  }, [today, unfinished, permission]);

  // Browser: the page timer.
  useEffect(() => {
    if (isNativeApp()) return;
    if (!today || unfinished === null || unfinished <= 0 || permission !== "granted") return;

    const tick = async () => {
      if (document.visibilityState !== "visible" || sendingRef.current) return;

      const { sent } = getTodayState(today);
      const slot = dueSlot(new Date(), sent);
      if (slot === null) return;

      sendingRef.current = true;
      // Another open window may own this slot; only the window that claims it sends.
      if (!(await tryClaimSlot(today, slot))) {
        sendingRef.current = false;
        return;
      }
      try {
        const displayed = await showHabitReminder(unfinished);
        // Do not consume a reminder slot when the browser failed to display it.
        if (!displayed) releaseSlot(today, slot);
      } catch (error) {
        console.error(error);
        releaseSlot(today, slot);
      } finally {
        sendingRef.current = false;
      }
    };

    const onFocus = () => void tick();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void tick();
    };

    void tick();
    const id = window.setInterval(() => void tick(), 30_000);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [today, unfinished, permission]);

  return { permission, request, syncError };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

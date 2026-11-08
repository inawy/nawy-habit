import { useCallback, useEffect, useRef, useState } from "react";

import { dueSlot } from "@/lib/reminders/slots";
import { getTodayState, recordSlotSent } from "@/lib/reminders/reminders-store";
import { showHabitReminder } from "@/lib/reminders/notify";

export type ReminderPermission = "granted" | "denied" | "default";

/**
 * Daily reminder scheduler, local-only. Fires at most 3 fixed slots per day
 * while the page is visible and active. It is not a background alarm and
 * never runs after the app or browser has been closed.
 */
export function useReminders(today: string | null, unfinished: number | null) {
  const [permission, setPermission] = useState<ReminderPermission | null>(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    if (typeof Notification === "undefined") return;
    setPermission(Notification.permission);
  }, []);

  const request = useCallback(async (): Promise<ReminderPermission> => {
    if (typeof Notification === "undefined") return "denied";
    const result = (await Notification.requestPermission()) as ReminderPermission;
    setPermission(result);
    return result;
  }, []);

  useEffect(() => {
    if (!today || unfinished === null || unfinished <= 0 || permission !== "granted") return;

    const tick = async () => {
      if (document.visibilityState !== "visible" || sendingRef.current) return;

      const { sent } = getTodayState(today);
      const slot = dueSlot(new Date(), sent);
      if (slot === null) return;

      sendingRef.current = true;
      try {
        const displayed = await showHabitReminder(unfinished);
        // Do not consume a reminder slot when the browser failed to display it.
        if (displayed) recordSlotSent(today, slot);
      } catch (error) {
        console.error(error);
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

  return { permission, request };
}

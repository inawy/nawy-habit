import { useCallback, useEffect, useState } from "react";

import { dueSlot } from "@/lib/reminders/slots";
import { getTodayState, recordSlotSent } from "@/lib/reminders/reminders-store";
import { showHabitReminder } from "@/lib/reminders/notify";

export type ReminderPermission = "granted" | "denied" | "default";

/**
 * Daily reminder scheduler, local-only. Fires at most 3 fixed slots per day
 * while the page is open and active. It is not a background alarm and never
 * runs after the app or browser has been closed.
 */
export function useReminders(today: string | null, unfinished: number | null) {
  const [permission, setPermission] = useState<ReminderPermission | null>(null);

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

    let sending = false;

    const tick = async () => {
      if (sending) return;

      const { sent } = getTodayState(today);
      const slot = dueSlot(new Date(), sent);
      if (slot === null) return;

      sending = true;
      try {
        const displayed = await showHabitReminder(unfinished);
        // Do not consume a reminder slot when the browser failed to display it.
        if (displayed) recordSlotSent(today, slot);
      } catch (error) {
        console.error(error);
      } finally {
        sending = false;
      }
    };

    void tick();
    const id = window.setInterval(() => void tick(), 30_000);
    const onFocus = () => void tick();
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [today, unfinished, permission]);

  return { permission, request };
}

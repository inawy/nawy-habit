import { useCallback, useEffect, useState } from "react";

import { dueSlot } from "@/lib/reminders/slots";
import { getTodayState, recordSlotSent } from "@/lib/reminders/reminders-store";
import { showHabitReminder } from "@/lib/reminders/notify";

export type ReminderPermission = "granted" | "denied" | "default";

/**
 * Daily reminder scheduler, local-only. Fires at most 3 fixed slots per day
 * while the app is open (including browser background), never when closed.
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

    const tick = () => {
      const { sent } = getTodayState(today);
      const slot = dueSlot(new Date(), sent);
      if (slot === null) return;
      recordSlotSent(today, slot);
      void showHabitReminder(unfinished);
    };

    tick();
    const id = setInterval(tick, 30_000);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", tick);
    };
  }, [today, unfinished, permission]);

  return { permission, request };
}

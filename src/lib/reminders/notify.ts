import { num } from "@/lib/format/numbers";

/**
 * Displays a daily reminder through the service worker when registered,
 * falling back to the Notification API. Scheduling still depends on the
 * app's active page timer; this function is not a background alarm.
 */
export async function showHabitReminder(unfinished: number): Promise<boolean> {
  if (typeof window === "undefined" || typeof Notification === "undefined") return false;
  const title = "ناوي للعادات";
  const body =
    unfinished === 1
      ? "عندك عادة واحدة لسه متسجلتش النهاردة 🌿"
      : `عندك ${num(unfinished)} عادات لسه متسجلتش النهاردة 🌿`;
  const options: NotificationOptions = {
    body,
    icon: `${import.meta.env.BASE_URL}icon-192.png`,
    lang: "ar",
    dir: "rtl",
    tag: "nawy-reminder",
  };
  try {
    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, options);
        return true;
      }
    }
    const notification = new Notification(title, options);
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

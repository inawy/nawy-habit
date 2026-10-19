import { num } from "@/lib/format/numbers";

/**
 * Shows the daily reminder through the service worker in production
 * (works while the app is in the background), falling back to a plain
 * Notification. Returns false when notifications are unavailable.
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
    icon: "/icon-192.png",
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

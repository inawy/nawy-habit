/**
 * Remembers that the user left the screen through the side menu, so that coming back (system
 * back button, browser back, or the in-app back arrow) reopens the menu instead of dropping them
 * on the bare screen they started from. Stored per tab and only trusted for a limited time.
 */
const KEY = "nawy-habit-sidebar-return";
const MAX_AGE_MS = 60 * 60 * 1000;

export function markSidebarReturn(now: number = Date.now()): void {
  try {
    window.sessionStorage.setItem(KEY, String(now));
  } catch {
    // Without storage the menu simply stays closed on return.
  }
}

/** True while a recent menu trip is pending; does not consume it. */
export function hasPendingSidebarReturn(now: number = Date.now()): boolean {
  try {
    const stamp = Number(window.sessionStorage.getItem(KEY));
    return Number.isFinite(stamp) && stamp > 0 && now - stamp >= 0 && now - stamp <= MAX_AGE_MS;
  } catch {
    return false;
  }
}

/** Returns true once for a pending trip and clears it. */
export function consumeSidebarReturn(now: number = Date.now()): boolean {
  const pending = hasPendingSidebarReturn(now);
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to clean up.
  }
  return pending;
}

const OPEN_EVENT = "nawy-habit:open-sidebar";

/** Asks the side menu to open (used by swipes handled outside the menu itself). */
export function requestSidebarOpen(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(OPEN_EVENT));
}

export function onSidebarOpenRequest(handler: () => void): () => void {
  window.addEventListener(OPEN_EVENT, handler);
  return () => window.removeEventListener(OPEN_EVENT, handler);
}

import { useEffect, useRef } from "react";

import { detectSideSwipe, type SideSwipe, type SwipePoint } from "@/lib/gestures/side-swipe";

/** Touches that begin here never start a swipe (text fields, sliders, drag handles). */
const IGNORED_START =
  "input, textarea, select, [contenteditable='true'], [role='slider'], [data-no-swipe]";
/** Any open sheet, dialog or menu owns the gestures until it closes. */
const OPEN_LAYER = "[role='dialog'], [role='menu'], [data-vaul-drawer]";

/**
 * Calls `handlers` when the user swipes from the right or left side of the screen. Touch and pen
 * only (a mouse never triggers it), and only while `enabled`. Vertical scrolling is untouched: the
 * hook never prevents default; it just reads the finished gesture.
 */
export function useSideSwipe(
  handlers: Partial<Record<SideSwipe, () => void>>,
  enabled = true,
): void {
  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });

  useEffect(() => {
    if (!enabled) return;
    let start: (SwipePoint & { id: number }) | null = null;

    const onDown = (event: PointerEvent) => {
      start = null;
      if (!event.isPrimary || event.pointerType === "mouse") return;
      const target = event.target;
      if (target instanceof Element && target.closest(IGNORED_START)) return;
      if (document.querySelector(OPEN_LAYER)) return;
      start = { id: event.pointerId, x: event.clientX, y: event.clientY, time: event.timeStamp };
    };
    const onUp = (event: PointerEvent) => {
      const began = start;
      start = null;
      if (!began || began.id !== event.pointerId) return;
      const result = detectSideSwipe(
        began,
        { x: event.clientX, y: event.clientY, time: event.timeStamp },
        window.innerWidth,
      );
      if (result) latest.current[result]?.();
    };
    const onCancel = () => {
      start = null;
    };

    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onCancel, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [enabled]);
}

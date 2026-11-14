export type SideSwipe = "right" | "left";

export interface SwipePoint {
  x: number;
  y: number;
  time: number;
}

/** A side zone is this share of the viewport width, so a swipe "from the right" starts there. */
export const SIDE_ZONE_RATIO = 0.35;
export const MIN_SWIPE_DISTANCE = 64;
export const MAX_SWIPE_DURATION_MS = 700;
/** The horizontal travel must clearly beat the vertical one, so scrolling never counts. */
export const HORIZONTAL_DOMINANCE = 1.6;

/**
 * Classifies a finished touch as a swipe that began at the right or left side of the screen.
 * "right" = started in the right zone and moved left; "left" = started in the left zone and moved
 * right. Returns null for anything else (taps, scrolls, slow drags, starts in the middle).
 */
export function detectSideSwipe(
  start: SwipePoint,
  end: SwipePoint,
  viewportWidth: number,
): SideSwipe | null {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (end.time - start.time > MAX_SWIPE_DURATION_MS) return null;
  if (Math.abs(dx) < MIN_SWIPE_DISTANCE) return null;
  if (Math.abs(dx) < Math.abs(dy) * HORIZONTAL_DOMINANCE) return null;

  const zone = viewportWidth * SIDE_ZONE_RATIO;
  if (start.x >= viewportWidth - zone && dx < 0) return "right";
  if (start.x <= zone && dx > 0) return "left";
  return null;
}

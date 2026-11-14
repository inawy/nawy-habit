import { describe, expect, it } from "vitest";

import { detectSideSwipe } from "./side-swipe";

const W = 400;
const at = (x: number, y: number, time: number) => ({ x, y, time });

describe("detectSideSwipe", () => {
  it("detects a leftward swipe that starts on the right side", () => {
    expect(detectSideSwipe(at(380, 300, 0), at(250, 310, 220), W)).toBe("right");
  });

  it("detects a rightward swipe that starts on the left side", () => {
    expect(detectSideSwipe(at(20, 300, 0), at(160, 295, 220), W)).toBe("left");
  });

  it("ignores swipes that start in the middle of the screen", () => {
    expect(detectSideSwipe(at(200, 300, 0), at(60, 300, 200), W)).toBeNull();
  });

  it("ignores the wrong direction for each side", () => {
    expect(detectSideSwipe(at(380, 300, 0), at(480, 300, 200), W)).toBeNull();
    expect(detectSideSwipe(at(20, 300, 0), at(-80, 300, 200), W)).toBeNull();
  });

  it("ignores short movements, scrolls and slow drags", () => {
    expect(detectSideSwipe(at(380, 300, 0), at(340, 300, 100), W)).toBeNull();
    expect(detectSideSwipe(at(380, 300, 0), at(280, 520, 300), W)).toBeNull();
    expect(detectSideSwipe(at(380, 300, 0), at(200, 300, 1200), W)).toBeNull();
  });
});

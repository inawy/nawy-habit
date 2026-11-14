import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TodayProgress } from "./today-progress";

describe("TodayProgress", () => {
  it("shows done out of total and exposes the progress bar", () => {
    render(<TodayProgress done={2} total={5} />);

    expect(screen.getByText("2 من 5 اليوم")).toBeTruthy();
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("2");
    expect(bar.getAttribute("aria-valuemax")).toBe("5");
  });

  it("acknowledges when every habit is done", () => {
    render(<TodayProgress done={3} total={3} />);
    expect(screen.getByText("أتممت عاداتك كلها اليوم")).toBeTruthy();
  });

  it("renders nothing without habits", () => {
    const { container } = render(<TodayProgress done={0} total={0} />);
    expect(container.firstChild).toBeNull();
  });
});

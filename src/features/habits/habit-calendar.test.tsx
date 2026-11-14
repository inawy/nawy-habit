import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HabitCalendar } from "./habit-calendar";

const today = "2026-11-14";

function setup(overrides: Partial<Parameters<typeof HabitCalendar>[0]> = {}) {
  const onMonthChange = vi.fn();
  render(
    <HabitCalendar
      month="2026-11"
      minMonth="2025-11"
      startMonth="2026-11"
      days={new Set()}
      today={today}
      onMonthChange={onMonthChange}
      onToggle={vi.fn()}
      {...overrides}
    />,
  );
  return onMonthChange;
}

describe("HabitCalendar navigation", () => {
  it("can go back before the habit started, but not into the future", () => {
    const onMonthChange = setup();

    const previous = screen.getByRole("button", { name: "الشهر السابق" });
    const next = screen.getByRole("button", { name: "الشهر التالي" });
    expect((previous as HTMLButtonElement).disabled).toBe(false);
    expect((next as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(previous);
    expect(onMonthChange).toHaveBeenCalledWith("2026-10");
  });

  it("stops at the oldest available month", () => {
    setup({ month: "2025-11" });
    expect(
      (screen.getByRole("button", { name: "الشهر السابق" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("explains that months before the start are for backfilling", () => {
    setup({ month: "2026-09" });
    expect(screen.getByText(/قبل بدء العادة/)).toBeTruthy();
  });

  it("does not allow ticking days that have not happened yet", () => {
    setup();
    const future = screen.getAllByRole("button").filter((b) => b.getAttribute("aria-pressed") === "false");
    const disabled = future.filter((b) => (b as HTMLButtonElement).disabled);
    expect(disabled.length).toBe(16); // 15 → 30 November
  });
});

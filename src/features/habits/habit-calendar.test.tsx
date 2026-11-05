import { render, screen } from "@testing-library/react";

import { HabitCalendar } from "@/features/habits/habit-calendar";
import type { DayKey } from "@/lib/date/day-key";
import type { MonthKey } from "@/lib/date/month";

const today = "2026-11-05" as DayKey;
const month = "2026-11" as MonthKey;

describe("HabitCalendar", () => {
  it("keeps month controls and day buttons accessible on mobile", () => {
    render(
      <HabitCalendar
        month={month}
        minMonth={month}
        days={new Set<DayKey>()}
        today={today}
        onMonthChange={() => {}}
        onToggle={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "الشهر السابق" })).toHaveClass("habit-month-nav");
    expect(screen.getByLabelText("اختيار الشهر")).toHaveClass("habit-month-picker");

    const dayButtons = screen
      .getAllByRole("button")
      .filter((button) => button.classList.contains("habit-month-day-button"));
    expect(dayButtons).toHaveLength(30);
    expect(dayButtons[0]?.getAttribute("aria-label")).toContain("لم يتم");
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import { HabitCalendar } from "@/features/habits/habit-calendar";
import type { DayKey } from "@/lib/date/day-key";
import type { MonthKey } from "@/lib/date/month";

const today = "2026-11-05" as DayKey;
const month = "2026-11" as MonthKey;

function dispatchPointer(
  target: HTMLElement,
  type: "pointerdown" | "pointerup",
  pointerId: number,
  clientX: number,
) {
  const event = new Event(type, { bubbles: true });
  Object.defineProperties(event, {
    pointerId: { value: pointerId },
    pointerType: { value: "touch" },
    isPrimary: { value: true },
    button: { value: 0 },
    clientX: { value: clientX },
  });
  fireEvent(target, event);
}

function InteractiveCalendar({
  initialMonth = "2026-10",
  minMonth = "2026-08",
}: {
  initialMonth?: MonthKey;
  minMonth?: MonthKey;
}) {
  const [selectedMonth, setSelectedMonth] = useState<MonthKey>(initialMonth);

  return (
    <>
      <output data-testid="selected-month">{selectedMonth}</output>
      <HabitCalendar
        month={selectedMonth}
        minMonth={minMonth}
        days={new Set<DayKey>()}
        today={today}
        onMonthChange={setSelectedMonth}
        onToggle={() => {}}
      />
    </>
  );
}

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

  it("navigates backward and forward when the desktop month arrows are clicked", () => {
    render(<InteractiveCalendar />);

    fireEvent.click(screen.getByRole("button", { name: "الشهر السابق" }));
    expect(screen.getByTestId("selected-month")).toHaveTextContent("2026-09");

    fireEvent.click(screen.getByRole("button", { name: "الشهر التالي" }));
    expect(screen.getByTestId("selected-month")).toHaveTextContent("2026-10");
  });

  it("navigates between months with horizontal pointer swipes on touch devices", () => {
    render(<InteractiveCalendar />);
    const calendar = screen.getByRole("region", { name: "تقويم العادة الشهري" });

    dispatchPointer(calendar, "pointerdown", 7, 240);
    dispatchPointer(calendar, "pointerup", 7, 310);
    expect(screen.getByTestId("selected-month")).toHaveTextContent("2026-09");

    dispatchPointer(calendar, "pointerdown", 8, 310);
    dispatchPointer(calendar, "pointerup", 8, 240);
    expect(screen.getByTestId("selected-month")).toHaveTextContent("2026-10");
  });

  it("does not navigate beyond the first or current month", () => {
    render(<InteractiveCalendar initialMonth="2026-11" minMonth="2026-11" />);
    const calendar = screen.getByRole("region", { name: "تقويم العادة الشهري" });

    expect(screen.getByRole("button", { name: "الشهر السابق" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "الشهر التالي" })).toBeDisabled();

    dispatchPointer(calendar, "pointerdown", 9, 300);
    dispatchPointer(calendar, "pointerup", 9, 220);
    expect(screen.getByTestId("selected-month")).toHaveTextContent("2026-11");
  });
});

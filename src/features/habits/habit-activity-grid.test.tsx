import { render, screen } from "@testing-library/react";

import { HabitActivityGrid } from "@/features/habits/habit-activity-grid";
import type { DayKey } from "@/lib/date/day-key";

const today = "2026-11-05" as DayKey;
const historyRegionLabel = "سجل الإنجازات؛ الأسابيع الأحدث جهة اليمين";

describe("HabitActivityGrid", () => {
  it("keeps the full-year detail history scrollable at a readable width", () => {
    const { container } = render(<HabitActivityGrid days={new Set()} today={today} />);

    expect(screen.getByRole("region", { name: historyRegionLabel })).toHaveAttribute(
      "tabindex",
      "0",
    );
    expect(container.querySelector(".habit-heatmap-viewport")).toHaveStyle({
      minWidth: "520px",
    });
    expect(screen.getByText("اسحب أفقيًا لعرض الأسابيع الأقدم")).toBeInTheDocument();
  });

  it("keeps the compact embedded history fitted to its container", () => {
    const { container } = render(<HabitActivityGrid days={new Set()} today={today} compact />);

    expect(screen.queryByRole("region", { name: historyRegionLabel })).not.toBeInTheDocument();
    expect(container.querySelector(".habit-heatmap-viewport")).toHaveStyle({
      minWidth: "100%",
    });
    expect(container.querySelector(".habit-heatmap")).not.toHaveClass("overflow-x-auto");
    expect(screen.queryByText("اسحب أفقيًا لعرض الأسابيع الأقدم")).not.toBeInTheDocument();
  });
});

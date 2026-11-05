import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { HabitMonthOverview } from "@/features/habits/habit-month-overview";
import type { DayKey } from "@/lib/date/day-key";
import type { Habit } from "@/lib/db/schema";

vi.mock("@/lib/db/habits-repo", () => ({
  toggleLog: vi.fn().mockResolvedValue(true),
}));

import { toggleLog } from "@/lib/db/habits-repo";

const today = "2026-11-05" as DayKey;
const habits: Habit[] = [
  {
    id: "reading",
    name: "القراءة",
    emoji: "📖",
    icon: "menu_book",
    color: "blue",
    order: 0,
    createdAt: "2026-08-01T08:00:00.000Z",
    archivedAt: null,
  },
  {
    id: "walking",
    name: "المشي",
    emoji: "🚶",
    icon: "directions_walk",
    color: "green",
    order: 1,
    createdAt: "2026-10-10T08:00:00.000Z",
    archivedAt: null,
  },
];

function renderOverview() {
  const days = new Map<string, Set<DayKey>>([
    ["reading", new Set<DayKey>([today])],
  ]);
  return render(<HabitMonthOverview habits={habits} daysByHabit={days} today={today} />);
}

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

describe("HabitMonthOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens on the current month and displays a monthly grid for every active habit", () => {
    renderOverview();

    expect(screen.getByLabelText("اختيار شهر العادات")).toHaveValue("2026-11");
    expect(screen.getAllByRole("link", { name: /عرض التفاصيل والسجل السنوي/ })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /5 نوفمبر/ })).toHaveLength(2);
  });

  it("changes the shared month for all habits with the navigation arrows", () => {
    renderOverview();

    fireEvent.click(screen.getByRole("button", { name: "الشهر السابق" }));
    expect(screen.getByLabelText("اختيار شهر العادات")).toHaveValue("2026-10");

    fireEvent.click(screen.getByRole("button", { name: "الشهر التالي" }));
    expect(screen.getByLabelText("اختيار شهر العادات")).toHaveValue("2026-11");
  });

  it("supports RTL horizontal swipes in both directions", () => {
    renderOverview();
    const region = screen.getByRole("region", { name: "شبكة العادات الشهرية" });

    dispatchPointer(region, "pointerdown", 1, 220);
    dispatchPointer(region, "pointerup", 1, 300);
    expect(screen.getByLabelText("اختيار شهر العادات")).toHaveValue("2026-10");

    dispatchPointer(region, "pointerdown", 2, 300);
    dispatchPointer(region, "pointerup", 2, 220);
    expect(screen.getByLabelText("اختيار شهر العادات")).toHaveValue("2026-11");
  });

  it("toggles a day without leaving the monthly view", () => {
    renderOverview();
    const todayButtons = screen.getAllByRole("button", { name: /5 نوفمبر/ });

    fireEvent.click(todayButtons[0]!);

    expect(toggleLog).toHaveBeenCalledWith("reading", today);
    expect(screen.getByLabelText("اختيار شهر العادات")).toHaveValue("2026-11");
  });

  it("does not offer dates before a habit was created", () => {
    renderOverview();
    fireEvent.click(screen.getByRole("button", { name: "الشهر السابق" }));

    expect(screen.getAllByRole("button", { name: /9 أكتوبر/ })).toHaveLength(1);
  });
});

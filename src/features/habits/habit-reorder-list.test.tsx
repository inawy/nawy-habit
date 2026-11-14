import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Habit } from "@/lib/db/schema";

import { HabitReorderList } from "./habit-reorder-list";

const habit = (id: string, name: string, order: number): Habit => ({
  id,
  name,
  emoji: "✨",
  icon: "auto_awesome",
  color: "blue",
  order,
  createdAt: "2026-01-01T00:00:00.000Z",
  archivedAt: null,
  deletedAt: null,
});

describe("HabitReorderList", () => {
  it("renders every habit in order with a labelled drag handle", () => {
    render(<HabitReorderList habits={[habit("a", "قراءة", 0), habit("b", "مشي", 1)]} />);

    const handles = screen.getAllByRole("button");
    expect(handles).toHaveLength(2);
    expect(handles[0]?.getAttribute("aria-label")).toContain("قراءة");
    expect(handles[1]?.getAttribute("aria-label")).toContain("مشي");
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Habit } from "@/lib/db/schema";

import { DragHandle, HabitSortableList, SortableRow } from "./habit-sortable";

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

const habits = [habit("a", "قراءة", 0), habit("b", "مشي", 1)];

function renderList(onRowPointerDown = vi.fn()) {
  render(
    <HabitSortableList habits={habits}>
      {(ordered) => (
        <ul>
          {ordered.map((item) => (
            <SortableRow key={item.id} habitId={item.id} onPointerDown={onRowPointerDown}>
              <a href={`/habit/${item.id}`}>{item.name}</a>
              <DragHandle habitName={item.name} />
            </SortableRow>
          ))}
        </ul>
      )}
    </HabitSortableList>,
  );
  return onRowPointerDown;
}

describe("sortable habit rows", () => {
  it("renders every habit in order with a labelled drag handle", () => {
    renderList();

    const handles = screen.getAllByRole("button");
    expect(handles).toHaveLength(2);
    expect(handles[0]?.getAttribute("aria-label")).toContain("قراءة");
    expect(handles[1]?.getAttribute("aria-label")).toContain("مشي");
  });

  it("keeps the habit link separate from the drag handle", () => {
    renderList();

    expect(screen.getByRole("link", { name: "قراءة" }).getAttribute("href")).toBe("/habit/a");
    expect(screen.getByRole("link", { name: "قراءة" }).closest("button")).toBeNull();
  });

  it("does not let a press on the handle reach the row (no long-press menu while dragging)", () => {
    const onRowPointerDown = renderList();

    const [handle] = screen.getAllByRole("button");
    if (!handle) throw new Error("drag handle not rendered");

    fireEvent.pointerDown(handle);
    expect(onRowPointerDown).not.toHaveBeenCalled();

    fireEvent.pointerDown(screen.getByRole("link", { name: "قراءة" }));
    expect(onRowPointerDown).toHaveBeenCalledTimes(1);
  });
});

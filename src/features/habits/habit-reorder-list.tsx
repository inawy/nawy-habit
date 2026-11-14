import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type Modifier,
  type ScreenReaderInstructions,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Icon } from "@/components/icon";
import { reorderHabits } from "@/lib/db/habits-repo";
import type { Habit } from "@/lib/db/schema";
import { num } from "@/lib/format/numbers";
import { cn } from "@/lib/utils";

const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });

const instructions: ScreenReaderInstructions = {
  draggable:
    "لإعادة الترتيب: اضغط مسافة لالتقاط العادة، ثم استخدم السهمين لأعلى ولأسفل، ثم اضغط مسافة للإفلات أو Esc للإلغاء.",
};

function SortableHabitRow({ habit, position }: { habit: Habit; position: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      data-habit-color={habit.color}
      className={cn(
        "relative flex items-center gap-3 rounded-xl border bg-card px-3 py-2",
        isDragging && "z-10 border-primary shadow-lg",
      )}
    >
      <span
        className="habit-identity grid size-9 shrink-0 place-items-center rounded-xl"
        data-habit-color={habit.color}
      >
        <Icon name={habit.icon} className="size-5" />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{habit.name}</span>
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`إعادة ترتيب «${habit.name}»، الموضع ${num(position)}`}
        title="اسحب لإعادة الترتيب"
        className="grid size-11 shrink-0 cursor-grab touch-none select-none place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
      >
        <Icon name="drag_indicator" className="size-6" />
      </button>
    </li>
  );
}

/** Drag-and-drop ordering of the active habits, built on dnd-kit (pointer, touch and keyboard). */
export function HabitReorderList({ habits }: { habits: Habit[] }) {
  const [items, setItems] = useState(habits);

  // Follow the database (live query) whenever it changes, e.g. after a save or from another tab.
  useEffect(() => setItems(habits), [habits]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const nameOf = (id: string | number) => items.find((habit) => habit.id === id)?.name ?? "";
  const positionOf = (id: string | number) => items.findIndex((habit) => habit.id === id) + 1;

  const announcements: Announcements = {
    onDragStart: ({ active }) => `التقطت «${nameOf(active.id)}».`,
    onDragOver: ({ active, over }) =>
      over ? `«${nameOf(active.id)}» أصبحت في الموضع ${num(positionOf(over.id))}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `أُفلتت «${nameOf(active.id)}» في الموضع ${num(positionOf(over.id))} من ${num(items.length)}.`
        : `أُفلتت «${nameOf(active.id)}» في مكانها.`,
    onDragCancel: ({ active }) => `أُلغيت إعادة ترتيب «${nameOf(active.id)}».`,
  };

  async function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((habit) => habit.id === active.id);
    const to = items.findIndex((habit) => habit.id === over.id);
    if (from < 0 || to < 0) return;

    const previous = items;
    const next = arrayMove(items, from, to);
    setItems(next);
    try {
      await reorderHabits(next.map((habit) => habit.id));
    } catch (error) {
      console.error(error);
      setItems(previous);
      toast.error("تعذّر حفظ الترتيب الجديد");
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      accessibility={{ announcements, screenReaderInstructions: instructions }}
      onDragEnd={(event) => void onDragEnd(event)}
    >
      <SortableContext
        items={items.map((habit) => habit.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="grid gap-2" aria-label="ترتيب العادات">
          {items.map((habit, index) => (
            <SortableHabitRow key={habit.id} habit={habit} position={index + 1} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

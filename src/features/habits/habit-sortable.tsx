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
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ComponentProps,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from "react";
import { toast } from "sonner";

import { Icon } from "@/components/icon";
import { reorderHabits } from "@/lib/db/habits-repo";
import type { Habit } from "@/lib/db/schema";
import { num } from "@/lib/format/numbers";
import { cn } from "@/lib/utils";

/**
 * Drag-and-drop ordering for the habit lists, built on dnd-kit.
 *
 * Gesture design — three actions share one row without fighting each other:
 *  - tap the name/icon  -> opens the habit history (plain link, untouched);
 *  - long-press the row -> context menu with habit options (Radix);
 *  - press and drag the grip handle -> reorder. Only the handle starts a drag, and it stops its
 *    pointer events from reaching the row so a drag never opens the menu or the link.
 */

type SortableApi = Pick<
  ReturnType<typeof useSortable>,
  "attributes" | "listeners" | "setActivatorNodeRef" | "isDragging"
>;

const RowDragContext = createContext<SortableApi | null>(null);

const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });

const instructions: ScreenReaderInstructions = {
  draggable:
    "لإعادة الترتيب: اضغط مسافة لالتقاط العادة، ثم استخدم السهمين لأعلى ولأسفل، ثم اضغط مسافة للإفلات أو Esc للإلغاء.",
};

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

/** Wraps a list of habits; owns the optimistic order and saves it when a drag ends. */
export function HabitSortableList({
  habits,
  children,
}: {
  habits: Habit[];
  children: (ordered: Habit[]) => ReactNode;
}) {
  const [items, setItems] = useState(habits);

  // Follow the database (live query) whenever it changes, e.g. after a save or from another tab.
  useEffect(() => setItems(habits), [habits]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
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
        {children(items)}
      </SortableContext>
    </DndContext>
  );
}

/**
 * A sortable `<li>`. It forwards every prop and the ref, so it can be the child of a Radix
 * `asChild` trigger (the long-press context menu) while still being the dnd-kit node.
 */
export function SortableRow({
  habitId,
  style,
  className,
  ref,
  children,
  ...rest
}: ComponentProps<"li"> & { habitId: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habitId });

  return (
    <RowDragContext.Provider value={{ attributes, listeners, setActivatorNodeRef, isDragging }}>
      <li
        {...rest}
        ref={(node) => {
          setNodeRef(node);
          assignRef(ref, node);
        }}
        style={{ ...style, transform: CSS.Transform.toString(transform), transition }}
        className={cn(
          "relative",
          isDragging && "z-20 bg-card shadow-lg ring-1 ring-primary/40",
          className,
        )}
      >
        {children}
      </li>
    </RowDragContext.Provider>
  );
}

/** The only element that starts a drag. Must be rendered inside a `SortableRow`. */
export function DragHandle({ habitName, className }: { habitName: string; className?: string }) {
  const sortable = useContext(RowDragContext);
  if (!sortable) return null;
  const { attributes, listeners, setActivatorNodeRef, isDragging } = sortable;
  const { onPointerDown, ...otherListeners } = listeners ?? {};

  return (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...otherListeners}
      onPointerDown={(event: PointerEvent<HTMLButtonElement>) => {
        // Let dnd-kit start the drag, but keep the event away from the row so the long-press
        // context menu never opens while the user is dragging.
        (onPointerDown as ((e: PointerEvent<HTMLButtonElement>) => void) | undefined)?.(event);
        event.stopPropagation();
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      aria-label={`إعادة ترتيب «${habitName}»`}
      title="اسحب لإعادة الترتيب"
      className={cn(
        "-ms-1 grid size-9 shrink-0 touch-none select-none place-items-center rounded-full text-muted-foreground/70 transition-colors [-webkit-touch-callout:none] hover:bg-muted hover:text-foreground",
        isDragging ? "cursor-grabbing" : "cursor-grab",
        className,
      )}
    >
      <Icon name="drag_indicator" className="size-5" />
    </button>
  );
}

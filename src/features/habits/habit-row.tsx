import { Link } from "@tanstack/react-router";
import { Icon } from "@/components/icon";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DayKey } from "@/lib/date/day-key";
import { archiveHabit, restoreHabit, toggleLog } from "@/lib/db/habits-repo";
import type { Habit } from "@/lib/db/schema";
import { num } from "@/lib/format/numbers";
import { computeStreaks } from "@/lib/habits/streak";
import { cn } from "@/lib/utils";

interface Props {
  habit: Habit;
  days: Set<DayKey>;
  today: DayKey;
  onEdit: (habit: Habit) => void;
}

/** Compact one-tap check-in row. Historical activity belongs on the detail page. */
export function HabitRow({ habit, days, today, onEdit }: Props) {
  const done = days.has(today);
  const { current } = computeStreaks(days, today);

  async function onToggle() {
    try {
      await toggleLog(habit.id, today);
    } catch (err) {
      console.error(err);
      toast.error("تعذّر التسجيل");
    }
  }

  async function onArchive() {
    await archiveHabit(habit.id);
    toast(`أُرشفت «${habit.name}»`, {
      action: { label: "تراجع", onClick: () => void restoreHabit(habit.id) },
    });
  }

  return (
    <li className="rounded-xl border bg-card px-3 py-2 shadow-sm">
      <div className="flex items-center gap-2.5">
        <Link
          to="/habit/$habitId"
          params={{ habitId: habit.id }}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg py-1 hover:bg-muted/60"
        >
          <span
            className="habit-identity grid size-10 shrink-0 place-items-center rounded-xl"
            data-habit-color={habit.color}
          >
            <Icon name={habit.icon} className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold">{habit.name}</h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Icon name="local_fire_department" className="size-3.5 text-accent-foreground" />
              {current > 0 ? `${num(current)} يوم متتالي` : "ابدأ اليوم"}
            </p>
          </span>
        </Link>
        <DropdownMenu dir="rtl">
          <DropdownMenuTrigger
            className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
            aria-label={`خيارات ${habit.name}`}
          >
            <Icon name="more_horiz" className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => onEdit(habit)}>تعديل</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void onArchive()}>أرشفة</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          type="button"
          onClick={() => void onToggle()}
          aria-pressed={done}
          aria-label={done ? `إلغاء تسجيل ${habit.name}` : `تسجيل ${habit.name} اليوم`}
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-full border-2 transition-all active:scale-95",
            done
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-transparent hover:border-primary/60",
          )}
        >
          <Icon name="check" className="size-5" />
        </button>
      </div>
    </li>
  );
}

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
import { parseDayKey } from "@/lib/date/day-key";
import { archiveHabit, restoreHabit, toggleLog } from "@/lib/db/habits-repo";
import type { Habit } from "@/lib/db/schema";
import { arabicFmt, num } from "@/lib/format/numbers";
import { computeStreaks } from "@/lib/habits/streak";
import { cn } from "@/lib/utils";

interface Props {
  habit: Habit;
  days: Set<DayKey>;
  recentDays: DayKey[];
  today: DayKey;
  onEdit: (habit: Habit) => void;
}

const fullDateFmt = arabicFmt({
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function HabitRow({ habit, days, recentDays, today, onEdit }: Props) {
  const { current } = computeStreaks(days, today);

  async function onToggle(day: DayKey) {
    try {
      await toggleLog(habit.id, day);
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
    <li
      className="habit-compact-row grid grid-cols-[minmax(0,1fr)_repeat(5,1.75rem)] items-center gap-x-1.5 px-3 py-2"
      data-habit-color={habit.color}
    >
      <div className="flex min-w-0 items-center gap-1">
        <Link
          to="/habit/$habitId"
          params={{ habitId: habit.id }}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1 hover:bg-muted/60"
        >
          <span
            className="habit-identity grid size-8 shrink-0 place-items-center rounded-lg"
            data-habit-color={habit.color}
          >
            <Icon name={habit.icon} className="size-[18px]" />
          </span>
          <span className="min-w-0 flex-1">
            <h3 className="truncate text-xs font-semibold">{habit.name}</h3>
            {current > 0 && (
              <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <Icon name="local_fire_department" className="size-3 text-accent-foreground" />
                {num(current)}
              </span>
            )}
          </span>
        </Link>
        <DropdownMenu dir="rtl">
          <DropdownMenuTrigger
            className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
            aria-label={`خيارات ${habit.name}`}
          >
            <Icon name="more_horiz" className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => onEdit(habit)}>تعديل</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void onArchive()}>أرشفة</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {recentDays.map((day) => {
        const complete = days.has(day);
        const isToday = day === today;
        const label = `${fullDateFmt.format(parseDayKey(day))} — ${complete ? "تم الإنجاز" : "بدون تسجيل"}${isToday ? " — اليوم" : ""}`;

        return (
          <button
            key={day}
            type="button"
            onClick={() => void onToggle(day)}
            aria-pressed={complete}
            aria-label={label}
            title={label}
            data-complete={complete}
            data-today={isToday}
            className={cn(
              "habit-day-cell grid size-7 shrink-0 place-items-center rounded-[9px] border transition-all active:scale-95",
              complete && "is-complete",
            )}
          >
            {complete && <Icon name="check" className="size-4" />}
          </button>
        );
      })}
    </li>
  );
}

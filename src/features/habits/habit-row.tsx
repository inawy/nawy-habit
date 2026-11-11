import { Link } from "@tanstack/react-router";
import { Icon } from "@/components/icon";
import { toast } from "sonner";

import type { DayKey } from "@/lib/date/day-key";
import { parseDayKey } from "@/lib/date/day-key";
import { toggleLog } from "@/lib/db/habits-repo";
import type { Habit } from "@/lib/db/schema";
import { arabicFmt } from "@/lib/format/numbers";
import { cn } from "@/lib/utils";

interface Props {
  habit: Habit;
  days: Set<DayKey>;
  recentDays: DayKey[];
  today: DayKey;
}

const fullDateFmt = arabicFmt({
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function HabitRow({ habit, days, recentDays, today }: Props) {
  async function onToggle(day: DayKey) {
    try {
      await toggleLog(habit.id, day);
    } catch (error) {
      console.error(error);
      toast.error("تعذّر التسجيل");
    }
  }

  return (
    <>
      <Link
        to="/habit/$habitId"
        params={{ habitId: habit.id }}
        className="flex min-w-0 items-center gap-2.5 rounded-lg py-1"
      >
        <span
          className="habit-identity grid size-9 shrink-0 place-items-center rounded-xl"
          data-habit-color={habit.color}
        >
          <Icon name={habit.icon} className="size-[19px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold leading-snug">
            {habit.name}
          </span>
        </span>
      </Link>

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
              "habit-day-cell grid size-8 shrink-0 place-items-center rounded-[10px] border transition-transform active:scale-95",
              complete && "is-complete",
            )}
          />
        );
      })}
    </>
  );
}

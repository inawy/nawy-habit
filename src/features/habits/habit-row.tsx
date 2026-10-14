import { Check, Flame, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { lastDays, parseDayKey, type DayKey } from "@/lib/date/day-key";
import { archiveHabit, restoreHabit, toggleLog } from "@/lib/db/habits-repo";
import type { Habit } from "@/lib/db/schema";
import { computeStreaks } from "@/lib/habits/streak";
import { cn } from "@/lib/utils";

const weekday = new Intl.DateTimeFormat("ar", { weekday: "narrow" });

interface Props {
  habit: Habit;
  days: Set<DayKey>;
  today: DayKey;
  onEdit: (habit: Habit) => void;
}

export function HabitRow({ habit, days, today, onEdit }: Props) {
  const done = days.has(today);
  const { current, best } = computeStreaks(days, today);

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
    <li className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span
          className="grid size-12 shrink-0 place-items-center rounded-xl bg-secondary text-2xl"
          aria-hidden
        >
          {habit.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{habit.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
            <Flame className="size-4 text-accent-foreground" aria-hidden />
            {current > 0 ? `${current.toLocaleString("ar")} يوم متتالي` : "ابدأ اليوم"}
            {best > 1 && <span className="ms-2">· الأفضل {best.toLocaleString("ar")}</span>}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
            aria-label={`خيارات ${habit.name}`}
          >
            <MoreHorizontal className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" dir="rtl">
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
            "grid size-12 shrink-0 place-items-center rounded-full border-2 transition-all active:scale-95",
            done
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-transparent hover:border-primary/60",
          )}
        >
          <Check className="size-6" strokeWidth={3} />
        </button>
      </div>
      <ol className="mt-4 grid grid-cols-7 gap-1.5" aria-label="آخر ٧ أيام">
        {lastDays(today, 7).map((d) => (
          <li key={d} className="flex flex-col items-center gap-1">
            <span className="text-[11px] text-muted-foreground">
              {weekday.format(parseDayKey(d))}
            </span>
            <span
              className={cn("h-2 w-full rounded-full", days.has(d) ? "bg-primary" : "bg-muted")}
              aria-label={days.has(d) ? "تم" : "لم يتم"}
            />
          </li>
        ))}
      </ol>
    </li>
  );
}

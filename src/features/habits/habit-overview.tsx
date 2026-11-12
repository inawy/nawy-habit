import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icon";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { toast } from "sonner";

import { HabitActivityGrid } from "@/features/habits/habit-activity-grid";
import { HabitRow } from "@/features/habits/habit-row";
import type { DayKey } from "@/lib/date/day-key";
import { addDays, parseDayKey } from "@/lib/date/day-key";
import { toggleLog } from "@/lib/db/habits-repo";
import type { Habit } from "@/lib/db/schema";
import { arabicFmt, num } from "@/lib/format/numbers";
import { computeStreaks } from "@/lib/habits/streak";

export type OverviewMode = "cards" | "checklist" | "compact";

interface OverviewProps {
  mode: OverviewMode;
  habits: Habit[];
  daysByHabit: Map<string, Set<DayKey>>;
  recentDays: DayKey[];
  today: DayKey;
  onEditHabit: (habit: Habit) => void;
  onArchiveHabit: (habit: Habit) => void;
  onDeleteHabit: (habit: Habit) => void;
  onShareHabit: (habit: Habit) => void;
}

const weekdayFmt = arabicFmt({ weekday: "short" });
const dayNumberFmt = arabicFmt({ day: "numeric" });
const dateRangeFmt = arabicFmt({ day: "numeric", month: "short" });

async function toggleToday(habit: Habit, today: DayKey) {
  try {
    const completed = await toggleLog(habit.id, today);
    toast.success(completed ? "اتسجل إنجاز النهارده" : "اتشال تسجيل النهارده", {
      duration: 1400,
    });
  } catch (error) {
    console.error(error);
    toast.error("تعذّر التسجيل");
  }
}

function TodayToggle({
  habit,
  today,
  complete,
}: {
  habit: Habit;
  today: DayKey;
  complete: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => void toggleToday(habit, today)}
      aria-label={complete ? `إلغاء إنجاز ${habit.name} اليوم` : `تسجيل إنجاز ${habit.name} اليوم`}
      aria-pressed={complete}
      data-complete={complete}
      className="habit-today-toggle grid size-8 shrink-0 place-items-center rounded-full border transition-colors active:scale-95"
    >
      <Icon name={complete ? "check" : "add"} className="size-[18px]" />
    </button>
  );
}

function HabitContextMenu({
  habit,
  days,
  today,
  onEdit,
  onArchive,
  onDelete,
  onShare,
  triggerClassName,
  children,
}: {
  habit: Habit;
  days: Set<DayKey>;
  today: DayKey;
  onEdit: (habit: Habit) => void;
  onArchive: (habit: Habit) => void;
  onDelete: (habit: Habit) => void;
  onShare: (habit: Habit) => void;
  triggerClassName: string;
  children: ReactNode;
}) {
  const yesterday = addDays(today, -1);
  const yesterdayComplete = days.has(yesterday);

  async function toggleYesterday() {
    try {
      const completed = await toggleLog(habit.id, yesterday);
      toast.success(completed ? "اتسجل إنجاز أمس" : "اتشال تسجيل أمس", { duration: 1400 });
    } catch (error) {
      console.error(error);
      toast.error("تعذّر التسجيل");
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger
        asChild
        aria-label={`خيارات ${habit.name}`}
        title="اضغط مطولًا لخيارات العادة"
      >
        <li className={triggerClassName} data-habit-color={habit.color}>
          {children}
        </li>
      </ContextMenuTrigger>
      <ContextMenuContent
        style={{ direction: "rtl" }}
        className="min-w-[14rem] rounded-2xl border bg-popover p-1.5 shadow-2xl"
      >
        <ContextMenuLabel className="truncate px-3 py-2 text-xs font-medium text-muted-foreground">
          {habit.name}
        </ContextMenuLabel>
        <ContextMenuSeparator className="my-1" />
        <ContextMenuItem
          className="min-h-11 gap-3 rounded-xl px-3 py-2.5 text-sm"
          onSelect={() => void toggleYesterday()}
        >
          <Icon name={yesterdayComplete ? "check" : "add"} className="size-[18px]" />
          <span>{yesterdayComplete ? "إلغاء إنجاز أمس" : "اكتمال أمس"}</span>
        </ContextMenuItem>
        <ContextMenuItem
          className="min-h-11 gap-3 rounded-xl px-3 py-2.5 text-sm"
          onSelect={() => onEdit(habit)}
        >
          <Icon name="edit" className="size-[18px]" />
          <span>تعديل العادة والمظهر</span>
        </ContextMenuItem>
        <ContextMenuItem asChild className="min-h-11 gap-3 rounded-xl px-3 py-2.5 text-sm">
          <Link to="/habit/$habitId" params={{ habitId: habit.id }}>
            <Icon name="calendar_month" className="size-[18px]" />
            <span>عرض سجل العادة</span>
          </Link>
        </ContextMenuItem>
        <ContextMenuItem
          className="min-h-11 gap-3 rounded-xl px-3 py-2.5 text-sm"
          onSelect={() => onShare(habit)}
        >
          <Icon name="ios_share" className="size-[18px]" />
          <span>مشاركة العادة</span>
        </ContextMenuItem>
        <ContextMenuSeparator className="my-1" />
        <ContextMenuItem
          className="min-h-11 gap-3 rounded-xl px-3 py-2.5 text-sm"
          onSelect={() => onArchive(habit)}
        >
          <Icon name="archive" className="size-[18px]" />
          <span>أرشفة العادة</span>
        </ContextMenuItem>
        <ContextMenuItem
          className="min-h-11 gap-3 rounded-xl px-3 py-2.5 text-sm text-destructive focus:text-destructive"
          onSelect={() => onDelete(habit)}
        >
          <Icon name="delete" className="size-[18px]" />
          <span>نقل إلى سلة المحذوفات</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function HabitChecklistItem({
  habit,
  days,
  today,
}: {
  habit: Habit;
  days: Set<DayKey>;
  today: DayKey;
}) {
  const streak = computeStreaks(days, today).current;
  const complete = days.has(today);

  return (
    <>
      <Link
        to="/habit/$habitId"
        params={{ habitId: habit.id }}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg"
      >
        <span
          className="habit-identity grid size-8 shrink-0 place-items-center rounded-lg"
          data-habit-color={habit.color}
        >
          <Icon name={habit.icon} className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{habit.name}</span>
          <span className="mt-0.5 block text-[11px] text-muted-foreground">
            {streak > 0 ? `${num(streak)} يوم متتالي` : "ابدأ بأول إنجاز"}
          </span>
        </span>
      </Link>
      <TodayToggle habit={habit} today={today} complete={complete} />
    </>
  );
}

function HabitOverviewCard({
  habit,
  days,
  today,
}: {
  habit: Habit;
  days: Set<DayKey>;
  today: DayKey;
}) {
  const streak = computeStreaks(days, today).current;
  const complete = days.has(today);

  return (
    <>
      <div className="flex min-w-0 items-center gap-3">
        <Link
          to="/habit/$habitId"
          params={{ habitId: habit.id }}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg"
        >
          <span
            className="habit-identity grid size-9 shrink-0 place-items-center rounded-xl"
            data-habit-color={habit.color}
          >
            <Icon name={habit.icon} className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{habit.name}</span>
            <span className="mt-0.5 block text-[11px] text-muted-foreground">
              {streak > 0 ? `${num(streak)} يوم متتالي` : `${num(days.size)} إنجاز سابق`}
            </span>
          </span>
        </Link>
        <TodayToggle habit={habit} today={today} complete={complete} />
      </div>
      <div className="habit-overview-history mt-1.5 pt-0.5">
        <HabitActivityGrid days={days} today={today} color={habit.color} compact />
      </div>
    </>
  );
}

export function HabitOverview({
  mode,
  habits,
  daysByHabit,
  recentDays,
  today,
  onEditHabit,
  onArchiveHabit,
  onDeleteHabit,
  onShareHabit,
}: OverviewProps) {
  if (mode === "cards") {
    return (
      <ul className="grid grid-cols-1 gap-2">
        {habits.map((habit) => {
          const days = daysByHabit.get(habit.id) ?? new Set<DayKey>();
          return (
            <HabitContextMenu
              key={habit.id}
              habit={habit}
              days={days}
              today={today}
              onEdit={onEditHabit}
              onArchive={onArchiveHabit}
              onDelete={onDeleteHabit}
              onShare={onShareHabit}
              triggerClassName="habit-overview-card rounded-xl border bg-card px-3 py-2"
            >
              <HabitOverviewCard habit={habit} days={days} today={today} />
            </HabitContextMenu>
          );
        })}
      </ul>
    );
  }

  if (mode === "checklist") {
    return (
      <ul className="habit-checklist overflow-hidden rounded-[1.35rem] border bg-card divide-y divide-border">
        {habits.map((habit) => {
          const days = daysByHabit.get(habit.id) ?? new Set<DayKey>();
          return (
            <HabitContextMenu
              key={habit.id}
              habit={habit}
              days={days}
              today={today}
              onEdit={onEditHabit}
              onArchive={onArchiveHabit}
              onDelete={onDeleteHabit}
              onShare={onShareHabit}
              triggerClassName="habit-checklist-row flex items-center gap-3 px-3 py-3"
            >
              <HabitChecklistItem habit={habit} days={days} today={today} />
            </HabitContextMenu>
          );
        })}
      </ul>
    );
  }

  return (
    <section
      className="habit-compact-panel overflow-hidden rounded-[1.35rem] border bg-card shadow-sm"
      aria-label="عاداتك خلال آخر خمسة أيام"
    >
      <div className="flex items-center justify-between gap-3 px-3 pb-2 pt-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          العادة
        </span>
        <span className="text-[10px] tabular-nums tracking-wide text-muted-foreground">
          {dateRangeFmt.format(parseDayKey(recentDays[0] ?? today))}
          {" — "}
          {dateRangeFmt.format(parseDayKey(today))}
        </span>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_repeat(5,2rem)] items-center gap-x-2 border-y bg-muted/30 px-3 py-2">
        <span className="min-w-0 text-[10px] font-medium text-muted-foreground"> </span>
        {recentDays.map((day) => (
          <span key={day} className="flex min-w-0 flex-col items-center gap-0.5 text-center">
            <span className="text-[9px] leading-none text-muted-foreground">
              {weekdayFmt.format(parseDayKey(day))}
            </span>
            <span
              className={
                day === today
                  ? "text-[11px] font-bold text-foreground"
                  : "text-[11px] text-muted-foreground"
              }
            >
              {dayNumberFmt.format(parseDayKey(day))}
            </span>
          </span>
        ))}
      </div>
      <ul className="divide-y divide-border/80">
        {habits.map((habit) => {
          const days = daysByHabit.get(habit.id) ?? new Set<DayKey>();
          return (
            <HabitContextMenu
              key={habit.id}
              habit={habit}
              days={days}
              today={today}
              onEdit={onEditHabit}
              onArchive={onArchiveHabit}
              onShare={onShareHabit}
              triggerClassName="habit-compact-row grid grid-cols-[minmax(0,1fr)_repeat(5,2rem)] items-center gap-x-2 px-3 py-2.5"
            >
              <HabitRow habit={habit} days={days} recentDays={recentDays} today={today} />
            </HabitContextMenu>
          );
        })}
      </ul>
    </section>
  );
}

const viewOptions: { value: OverviewMode; label: string; icon: IconName }[] = [
  { value: "cards", label: "بطاقات", icon: "grid_view" },
  { value: "checklist", label: "قائمة", icon: "view_list" },
  { value: "compact", label: "مختصر", icon: "view_compact" },
];

export function HabitViewCycleButton({
  value,
  onChange,
}: {
  value: OverviewMode;
  onChange: (mode: OverviewMode) => void;
}) {
  const currentIndex = viewOptions.findIndex((option) => option.value === value);
  const fallbackOption = {
    value: "compact",
    label: "مختصر",
    icon: "view_compact",
  } as const;
  const currentOption = viewOptions[currentIndex] ?? fallbackOption;

  const cycleMode = () => {
    const nextOption = viewOptions[(currentIndex + 1) % viewOptions.length] ?? fallbackOption;
    onChange(nextOption.value);
  };

  return (
    <button
      type="button"
      onClick={cycleMode}
      aria-label={`طريقة العرض الحالية: ${currentOption.label}. اضغط للتغيير`}
      title={`الوضع الحالي: ${currentOption.label} — تغيير طريقة العرض`}
      className="habit-toolbar-action grid size-10 place-items-center rounded-full border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Icon name={currentOption.icon} className="size-5" />
    </button>
  );
}

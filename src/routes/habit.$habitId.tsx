import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Icon } from "@/components/icon";
import { HabitIcon } from "@/components/habit-icon";
import { AppSidebar } from "@/components/app-sidebar";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HabitCalendar } from "@/features/habits/habit-calendar";
import { HabitActivityGrid } from "@/features/habits/habit-activity-grid";
import { HabitFormDialog } from "@/features/habits/habit-form-dialog";
import { useHabitDetailView } from "@/features/habits/use-habit-detail";
import { useToday } from "@/features/habits/use-habits";
import { parseDayKey, toDayKey, type DayKey } from "@/lib/date/day-key";
import { calendarMinMonth, toMonthKey, type MonthKey } from "@/lib/date/month";
import {
  archiveHabit,
  moveHabitToTrash,
  restoreFromTrash,
  restoreHabit,
  toggleLog,
} from "@/lib/db/habits-repo";
import { arabicFmt, num } from "@/lib/format/numbers";
import { monthProgress } from "@/lib/habits/consistency";
import { computeStreaks } from "@/lib/habits/streak";

export const Route = createFileRoute("/habit/$habitId")({
  head: () => ({
    meta: [
      { title: "عادة — تفاصيل العادة" },
      {
        name: "description",
        content: "سجل الإنجاز ونسبة الالتزام، مع إمكانية تعديل الأيام السابقة.",
      },
      { property: "og:title", content: "عادة — تفاصيل العادة" },
      {
        property: "og:description",
        content: "اطّلع على سجل إنجازك ونسبة التزامك، وعدّل أي يوم سابق.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HabitDetailPage,
});

function HabitDetailPage() {
  const { habitId } = Route.useParams();
  const navigate = useNavigate();
  const today = useToday();
  const view = useHabitDetailView(habitId);
  const [pickedMonth, setPickedMonth] = useState<MonthKey | null>(null);
  const [editing, setEditing] = useState(false);

  const month = pickedMonth ?? (today ? toMonthKey(today) : null);

  if (!today || view === undefined || !month) {
    return (
      <main className="mx-auto min-h-screen max-w-xl px-4 pb-28 pt-8">
        <div className="h-9 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="mt-6 h-28 animate-pulse rounded-2xl bg-muted" />
        <div className="mt-4 h-72 animate-pulse rounded-2xl bg-muted" />
      </main>
    );
  }

  if (view === null) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 text-center">
        <h1 className="mt-3 text-lg font-semibold">لم نعثر على هذه العادة</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ربما حُذفت العادة، أو أن الرابط غير صحيح.
        </p>
        <Button asChild className="mt-5">
          <Link to="/" replace>
            ارجع لليوم
          </Link>
        </Button>
      </main>
    );
  }

  const { habit, days } = view;
  const streaks = computeStreaks(days, today);
  const habitStartDay = toDayKey(new Date(habit.createdAt));
  const monthLabel = arabicFmt({ month: "long", year: "numeric" }).format(
    parseDayKey(month + "-01"),
  );
  const currentMonth = toMonthKey(today);
  const oldestLogDay = Array.from(days).sort()[0] ?? habitStartDay;
  const historyStartDay = habitStartDay < oldestLogDay ? habitStartDay : oldestLogDay;
  const startMonth = toMonthKey(historyStartDay);
  // Allow going back past the start so forgotten days can still be filled in.
  const minMonth = calendarMinMonth(historyStartDay);
  const progress = monthProgress(days, month, today, historyStartDay);
  const percent = progress.rate === null ? null : Math.round(progress.rate * 100);

  async function onToggleDay(day: DayKey) {
    try {
      await toggleLog(habit.id, day);
    } catch (error) {
      console.error(error);
      toast.error("تعذّر التسجيل");
    }
  }

  async function onArchive() {
    await archiveHabit(habit.id);
    toast(`أُرشفت «${habit.name}»`, {
      action: { label: "تراجع", onClick: () => void restoreHabit(habit.id) },
    });
  }

  async function onTrash() {
    try {
      await moveHabitToTrash(habit.id);
      toast(`نُقلت «${habit.name}» إلى سلة المحذوفات`, {
        action: {
          label: "تراجع",
          onClick: () => {
            void restoreFromTrash(habit.id).catch(() => toast.error("تعذّرت استعادة العادة"));
          },
        },
      });
      void navigate({ to: "/", replace: true });
    } catch {
      toast.error("تعذّر نقل العادة إلى سلة المحذوفات");
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 pb-[calc(env(safe-area-inset-bottom)+2.5rem)] pt-5">
      <div className="flex items-center justify-between">
        <Link
          to="/"
          replace
          aria-label="العودة للعادات"
          title="العودة للعادات"
          className="habit-toolbar-action grid size-10 place-items-center rounded-full border bg-card text-muted-foreground transition-colors hover:bg-muted"
        >
          <Icon name="chevron_right" className="size-5" />
        </Link>
        <div className="flex items-center gap-2">
          <AppSidebar />
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="تعديل العادة"
            title="تعديل العادة"
            className="habit-toolbar-action grid size-10 place-items-center rounded-full border bg-card text-muted-foreground transition-colors hover:bg-muted"
          >
            <Icon name="edit" className="size-5" />
          </button>
        </div>
      </div>

      <header className="mt-5 flex items-center gap-3">
        <span
          className="habit-identity grid size-14 shrink-0 place-items-center rounded-2xl"
          data-habit-color={habit.color}
        >
          <HabitIcon name={habit.icon} className="size-7" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[1.6rem] font-bold leading-tight">{habit.name}</h1>
          <p className="mt-1 text-xs text-muted-foreground">سجلّك الخاص مع هذه العادة</p>
        </div>
      </header>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="إحصاءات العادة">
        <span className="habit-stat-chip" data-habit-color={habit.color}>
          <Icon name="local_fire_department" className="size-4" />
          <span>{num(streaks.current)} متتالي</span>
        </span>
        <span className="habit-stat-chip">
          <span className="font-semibold">{num(streaks.best)}</span>
          <span>أفضل سلسلة</span>
        </span>
        <span className="habit-stat-chip">
          <span className="font-semibold">{num(streaks.total)}</span>
          <span>يوم إنجاز</span>
        </span>
      </div>

      {habit.archivedAt && (
        <p className="mt-4 rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
          هذه العادة مؤرشفة.{" "}
          <button
            type="button"
            onClick={() => void restoreHabit(habit.id)}
            className="font-medium text-primary underline underline-offset-2"
          >
            استعادتها
          </button>
        </p>
      )}

      <section
        className="habit-history-panel mt-5 rounded-[1.4rem] border p-4"
        data-habit-color={habit.color}
        aria-label="سجل العادة بالكامل"
      >
        <HabitActivityGrid
          days={days}
          today={today}
          color={habit.color}
          startDate={historyStartDay}
        />
      </section>

      <section className="mt-4" aria-label="التقويم الشهري وتعديل السجل السابق">
        <HabitCalendar
          month={month}
          minMonth={minMonth}
          startMonth={startMonth}
          days={days}
          today={today}
          onMonthChange={setPickedMonth}
          onToggle={(day) => void onToggleDay(day)}
        />
      </section>

      <section
        className="habit-progress-card mt-5 rounded-[1.4rem] border bg-card p-4"
        data-habit-color={habit.color}
      >
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xs font-medium text-muted-foreground">
              {month === currentMonth ? "الالتزام هذا الشهر" : "الالتزام في " + monthLabel}
            </h2>
            <p className="mt-1 text-3xl font-bold tabular-nums">
              {percent === null ? "—" : `${num(percent)}٪`}
            </p>
          </div>
          {progress.elapsed > 0 && (
            <p className="pb-1 text-xs text-muted-foreground">
              {num(progress.done)} من {num(progress.elapsed)} يوم
            </p>
          )}
        </div>
        <div
          className="habit-progress-track mt-3 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent ?? 0}
          aria-label={
            month === currentMonth ? "نسبة الالتزام هذا الشهر" : "نسبة الالتزام في " + monthLabel
          }
        >
          <div
            className="habit-progress-fill h-full rounded-full transition-[width] duration-300"
            style={{ width: `${percent ?? 0}%` }}
          />
        </div>
      </section>

      <section className="mt-6" aria-label="إدارة العادة">
        <h2 className="mb-2 px-1 text-xs font-medium text-muted-foreground">إدارة العادة</h2>
        <ul className="divide-y overflow-hidden rounded-[1.4rem] border bg-card">
          <li>
            <ManageRow
              icon="edit"
              title="تعديل العادة"
              description="الاسم والأيقونة واللون"
              onClick={() => setEditing(true)}
            />
          </li>
          <li>
            {habit.archivedAt ? (
              <ManageRow
                icon="restore"
                title="استعادة العادة"
                description="إرجاعها إلى قائمة عاداتك"
                onClick={() => void restoreHabit(habit.id)}
              />
            ) : (
              <ManageRow
                icon="archive"
                title="أرشفة العادة"
                description="تُخفى من اليوم ويبقى سجلّها محفوظًا"
                onClick={() => void onArchive()}
              />
            )}
          </li>
          <li>
            <ManageRow
              icon="delete"
              title="نقل إلى سلة المحذوفات"
              description="يمكنك استعادتها لاحقًا من السلة"
              tone="danger"
              onClick={() => void onTrash()}
            />
          </li>
        </ul>
      </section>

      <HabitFormDialog open={editing} onOpenChange={setEditing} habit={habit} />
    </main>
  );
}

function ManageRow({
  icon,
  title,
  description,
  tone = "default",
  onClick,
}: {
  icon: "edit" | "restore" | "archive" | "delete";
  title: string;
  description: string;
  tone?: "default" | "danger";
  onClick: () => void;
}): ReactNode {
  const danger = tone === "danger";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-16 w-full items-center gap-3 px-4 py-3 text-start transition-colors active:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        danger ? "text-destructive hover:bg-destructive/5" : "text-foreground hover:bg-muted/60",
      )}
    >
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl",
          danger ? "bg-destructive/10" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon name={icon} className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-5">{title}</span>
        <span
          className={cn(
            "mt-0.5 block text-xs leading-4",
            danger ? "text-destructive/70" : "text-muted-foreground",
          )}
        >
          {description}
        </span>
      </span>
      <Icon name="chevron_left" className="size-5 shrink-0 text-muted-foreground/60" />
    </button>
  );
}

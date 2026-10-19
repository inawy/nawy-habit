import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Settings } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { HabitFormDialog } from "@/features/habits/habit-form-dialog";
import { HabitRow } from "@/features/habits/habit-row";
import { useHabitsView, useToday } from "@/features/habits/use-habits";
import { ReminderBanner } from "@/features/reminders/reminder-banner";
import { parseDayKey } from "@/lib/date/day-key";
import { arabicFmt, num } from "@/lib/format/numbers";
import type { Habit } from "@/lib/db/schema";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "اليوم — ناوي للعادات" },
      {
        name: "description",
        content: "سجّل عاداتك اليومية بضغطة واحدة، وبياناتك محفوظة على جهازك.",
      },
      { property: "og:title", content: "ناوي للعادات" },
      {
        property: "og:description",
        content: "متتبع عادات هادئ يعمل بدون إنترنت ويحفظ بياناتك على جهازك.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TodayPage,
});

const dateFmt = arabicFmt({ weekday: "long", day: "numeric", month: "long" });

function TodayPage() {
  const today = useToday();
  const view = useHabitsView();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (h: Habit) => {
    setEditing(h);
    setDialogOpen(true);
  };

  const doneCount =
    today && view ? view.habits.filter((h) => view.daysByHabit.get(h.id)?.has(today)).length : 0;

  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 pb-28 pt-8">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {today ? dateFmt.format(parseDayKey(today)) : "\u00a0"}
          </p>
          <Link
            to="/settings"
            aria-label="بياناتك والنسخ الاحتياطي"
            className="rounded-full p-2 text-muted-foreground hover:bg-muted"
          >
            <Settings className="size-5" />
          </Link>
        </div>
        <h1 className="mt-1 text-3xl font-bold">اليوم</h1>
        {view && view.habits.length > 0 && (
          <p className="mt-2 text-muted-foreground" aria-live="polite">
            أنجزت {num(doneCount)} من {num(view.habits.length)}
          </p>
        )}
      </header>

      {!view || !today ? (
        <div className="space-y-3" aria-busy>
          {[0, 1].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : view.habits.length === 0 ? (
        <section className="rounded-2xl border border-dashed p-10 text-center">
          <p className="text-4xl" aria-hidden>
            🌱
          </p>
          <h2 className="mt-3 text-lg font-semibold">ابدأ بعادة واحدة</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            صغيرة وسهلة، والاستمرار أهم من الكمال.
          </p>
          <Button className="mt-5" onClick={openNew}>
            <Plus /> أضف عادة
          </Button>
        </section>
      ) : (
        <ul className="space-y-3">
          {view.habits.map((h) => (
            <HabitRow
              key={h.id}
              habit={h}
              days={view.daysByHabit.get(h.id) ?? new Set()}
              today={today}
              onEdit={openEdit}
            />
          ))}
        </ul>
      )}

      {view && view.habits.length > 0 && (
        <Button
          size="lg"
          onClick={openNew}
          className="fixed bottom-6 left-1/2 h-14 -translate-x-1/2 rounded-full px-6 shadow-lg"
        >
          <Plus /> عادة جديدة
        </Button>
      )}

      <HabitFormDialog open={dialogOpen} onOpenChange={setDialogOpen} habit={editing} />
    </main>
  );
}

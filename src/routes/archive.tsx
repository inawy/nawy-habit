import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";

import { PageBackButton } from "@/components/page-back-button";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { listArchivedHabits, moveHabitToTrash, restoreHabit } from "@/lib/db/habits-repo";

export const Route = createFileRoute("/archive")({
  head: () => ({ meta: [{ title: "عادة — الأرشيف" }] }),
  component: ArchivePage,
});

function ArchivePage() {
  const habits = useLiveQuery(() => listArchivedHabits());

  async function restore(id: string, name: string) {
    try {
      await restoreHabit(id);
      toast.success(`رجعت «${name}» لعاداتك`);
    } catch {
      toast.error("تعذّرت استعادة العادة");
    }
  }

  async function trash(id: string, name: string) {
    try {
      await moveHabitToTrash(id);
      toast.success(`نُقلت «${name}» إلى سلة المحذوفات`);
    } catch {
      toast.error("تعذّر نقل العادة إلى السلة");
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 pb-16 pt-5 sm:px-5">
      <header className="flex items-center gap-3">
        <PageBackButton />
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">الأرشيف</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            عادات احتفظت بها بعيدًا عن قائمة اليوم.
          </p>
        </div>
      </header>

      {habits === undefined ? (
        <div className="mt-6 h-24 animate-pulse rounded-2xl bg-muted" />
      ) : habits.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-dashed px-5 py-12 text-center">
          <Icon name="archive" className="mx-auto size-8 text-muted-foreground" />
          <h2 className="mt-3 font-semibold">الأرشيف فارغ</h2>
          <p className="mt-1 text-sm text-muted-foreground">العادات المؤرشفة هتظهر هنا.</p>
        </section>
      ) : (
        <div className="mt-6 space-y-2">
          {habits.map((habit) => (
            <article
              key={habit.id}
              className="flex items-center gap-3 rounded-2xl border bg-card p-3"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
                <Icon name={habit.icon} className="size-5" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{habit.name}</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="إعادة إلى عاداتي"
                title="استعادة"
                onClick={() => void restore(habit.id, habit.name)}
              >
                <Icon name="restore" className="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="نقل إلى سلة المحذوفات"
                title="نقل للسلة"
                onClick={() => void trash(habit.id, habit.name)}
              >
                <Icon name="delete" className="size-5" />
              </Button>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

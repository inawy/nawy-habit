import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AppSidebar } from "@/components/app-sidebar";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import {
  listTrashedHabits,
  permanentlyDeleteHabit,
  restoreFromTrash,
  TRASH_RETENTION_DAYS,
} from "@/lib/db/habits-repo";
import { num } from "@/lib/format/numbers";
import type { Habit } from "@/lib/db/schema";

export const Route = createFileRoute("/trash")({
  head: () => ({ meta: [{ title: "عادة — سلة المحذوفات" }] }),
  component: TrashPage,
});

const DAY_MS = 24 * 60 * 60 * 1000;

function TrashPage() {
  const habits = useLiveQuery(() => listTrashedHabits());
  const [pending, setPending] = useState<Habit | null>(null);

  async function restore(habit: Habit) {
    try {
      await restoreFromTrash(habit.id);
      toast.success(`تمت استعادة «${habit.name}»`);
    } catch {
      toast.error("تعذّرت استعادة العادة");
    }
  }

  async function removeForever() {
    if (!pending) return;
    try {
      await permanentlyDeleteHabit(pending.id);
      toast.success("تم حذف العادة نهائيًا");
    } catch {
      toast.error("تعذّر حذف العادة");
    } finally {
      setPending(null);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 pb-16 pt-5 sm:px-5">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">سلة المحذوفات</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            العادات هنا لمدة ٣٠ يومًا قبل حذفها نهائيًا.
          </p>
        </div>
        <AppSidebar />
      </header>

      {habits === undefined ? (
        <div className="mt-6 h-24 animate-pulse rounded-2xl bg-muted" />
      ) : habits.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-dashed px-5 py-12 text-center">
          <Icon name="delete" className="mx-auto size-8 text-muted-foreground" />
          <h2 className="mt-3 font-semibold">السلة فارغة</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            أي عادة تحذفها هتظهر هنا لمدة ٣٠ يومًا.
          </p>
        </section>
      ) : (
        <div className="mt-6 space-y-2">
          {habits.map((habit) => {
            const expiresAt =
              new Date(habit.deletedAt ?? Date.now()).getTime() + TRASH_RETENTION_DAYS * DAY_MS;
            const daysLeft = Math.max(0, Math.ceil((expiresAt - Date.now()) / DAY_MS));
            return (
              <article
                key={habit.id}
                className="flex items-center gap-3 rounded-2xl border bg-card p-3"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
                  <Icon name={habit.icon} className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-semibold">{habit.name}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {daysLeft === 0
                      ? "سيُحذف نهائيًا قريبًا"
                      : `متبقي ${num(daysLeft)} يوم على الحذف النهائي`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="استعادة العادة"
                  title="استعادة"
                  onClick={() => void restore(habit)}
                >
                  <Icon name="restore" className="size-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="حذف نهائي"
                  title="حذف نهائي"
                  onClick={() => setPending(habit)}
                >
                  <Icon name="delete_forever" className="size-5" />
                </Button>
              </article>
            );
          })}
        </div>
      )}

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader className="text-start sm:text-start">
            <AlertDialogTitle>حذف العادة نهائيًا؟</AlertDialogTitle>
            <AlertDialogDescription>
              لن يمكن استعادة «{pending?.name}» أو سجل إنجازاتها بعد الحذف.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:space-x-0">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <Button variant="destructive" onClick={() => void removeForever()}>
              حذف نهائي
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

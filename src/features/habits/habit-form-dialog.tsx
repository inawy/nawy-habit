import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createHabit, updateHabit } from "@/lib/db/habits-repo";
import { habitInputSchema, type Habit } from "@/lib/db/schema";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit: Habit | null;
}

export function HabitFormDialog({ open, onOpenChange, habit }: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(habit?.name ?? "");
      setError(null);
    }
  }, [open, habit]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    // Keep the legacy stored field unchanged until a dedicated data migration is prepared.
    const parsed = habitInputSchema.safeParse({ name, emoji: habit?.emoji ?? "✨" });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "بيانات غير صالحة");
      return;
    }
    try {
      if (habit) await updateHabit(habit.id, parsed.data);
      else await createHabit(parsed.data);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("تعذّر الحفظ، حاول مرة أخرى");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="text-start">
        <form onSubmit={onSubmit} className="space-y-5">
          <DialogHeader className="text-start sm:text-start">
            <DialogTitle>{habit ? "تعديل العادة" : "عادة جديدة"}</DialogTitle>
            <DialogDescription>ابدأ بشيء صغير تقدر تكرره كل يوم.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="habit-name">الاسم</Label>
            <Input
              id="habit-name"
              value={name}
              autoFocus
              maxLength={60}
              placeholder="مثلًا: قراءة 10 صفحات"
              onChange={(e) => setName(e.target.value)}
              aria-invalid={error ? true : undefined}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button type="submit">{habit ? "حفظ" : "إضافة"}</Button>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

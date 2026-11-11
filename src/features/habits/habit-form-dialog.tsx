import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DEFAULT_HABIT_COLOR,
  DEFAULT_HABIT_ICON,
  HABIT_COLOR_OPTIONS,
  HABIT_ICON_OPTIONS,
} from "@/lib/habits/appearance";
import { createHabit, updateHabit } from "@/lib/db/habits-repo";
import { habitInputSchema, type Habit } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit: Habit | null;
}

export function HabitFormDialog({ open, onOpenChange, habit }: Props) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(DEFAULT_HABIT_ICON);
  const [color, setColor] = useState(DEFAULT_HABIT_COLOR);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(habit?.name ?? "");
      setIcon(habit?.icon ?? DEFAULT_HABIT_ICON);
      setColor(habit?.color ?? DEFAULT_HABIT_COLOR);
      setError(null);
    }
  }, [open, habit]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    // Keep the legacy stored field unchanged for old local data and v1 backups.
    const parsed = habitInputSchema.safeParse({
      name,
      emoji: habit?.emoji ?? "✨",
      icon,
      color,
    });
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        dir="rtl"
        className="mx-auto flex max-h-[min(84dvh,42rem)] w-full max-w-xl flex-col gap-0 overflow-y-auto rounded-t-2xl border-x border-t bg-card px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-5 shadow-lg sm:rounded-t-2xl sm:px-6"
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <SheetHeader className="mb-4 space-y-1 pe-9 text-start">
            <SheetTitle className="text-lg font-semibold tracking-tight">
              {habit ? "تعديل العادة" : "عادة جديدة"}
            </SheetTitle>
            <SheetDescription className="text-sm leading-6">
              ابدأ بشيء صغير تقدر تكرره كل يوم.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-2">
            <Label htmlFor="habit-name">اسم العادة</Label>
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

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">اختار رمزًا للعادة</legend>
            <div className="grid grid-cols-6 gap-2">
              {HABIT_ICON_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-label={"رمز " + option.label}
                  aria-pressed={icon === option.value}
                  title={option.label}
                  onClick={() => setIcon(option.value)}
                  className={cn(
                    "grid size-12 place-items-center rounded-2xl border transition-all duration-150",
                    icon === option.value
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-muted",
                  )}
                >
                  <Icon name={option.value} className="size-5" />
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">لون العادة</legend>
            <div className="flex flex-wrap items-center gap-2.5">
              {HABIT_COLOR_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-label={"اللون " + option.label}
                  aria-pressed={color === option.value}
                  title={option.label}
                  onClick={() => setColor(option.value)}
                  className={cn(
                    "grid size-9 place-items-center rounded-full border-2 transition-colors",
                    color === option.value
                      ? "border-ring ring-2 ring-ring ring-offset-2 ring-offset-background"
                      : "border-transparent",
                  )}
                >
                  <span
                    className="size-6 rounded-full"
                    style={{ backgroundColor: option.swatch }}
                  />
                </button>
              ))}
            </div>
          </fieldset>

          <div className="sticky bottom-0 -mx-4 mt-1 flex gap-2 border-t bg-card px-4 pb-1 pt-3 sm:-mx-6 sm:px-6">
            <Button type="submit" className="h-10 flex-1 rounded-full text-sm font-semibold">
              {habit ? "حفظ التعديلات" : "إضافة العادة"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-full px-5 text-sm"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

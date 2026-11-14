import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { HabitIcon } from "@/components/habit-icon";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HABIT_SUGGESTIONS } from "@/features/habits/habit-suggestions";
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

  const canSave = name.trim().length > 0;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent dir="rtl" className="mx-auto max-h-[92dvh] max-w-xl rounded-t-3xl">
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-3">
            <div className="min-w-0 space-y-1">
              <DrawerTitle className="text-xl font-bold leading-tight">
                {habit ? "تعديل العادة" : "عادة جديدة"}
              </DrawerTitle>
              <DrawerDescription className="text-sm leading-6">
                {habit ? "غيّر الاسم أو الرمز أو اللون." : "ابدأ بشيء صغير تقدر تكرره كل يوم."}
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <button
                type="button"
                aria-label="إغلاق"
                title="إغلاق"
                className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon name="close" className="size-5" />
              </button>
            </DrawerClose>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="habit-name">اسم العادة</Label>
              <div className="flex items-center gap-3">
                <span
                  className="habit-identity grid size-14 shrink-0 place-items-center rounded-2xl"
                  data-habit-color={color}
                  aria-hidden="true"
                >
                  <HabitIcon name={icon} className="size-7" />
                </span>
                <Input
                  id="habit-name"
                  value={name}
                  autoFocus={!habit}
                  maxLength={60}
                  enterKeyHint="done"
                  placeholder="مثلًا: قراءة 10 صفحات"
                  className="h-14 flex-1 rounded-2xl text-base"
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={error ? true : undefined}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            {!habit && (
              <div className="space-y-2">
                <p className="text-sm font-medium">أو اختر فكرة جاهزة</p>
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                  {HABIT_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion.name}
                      type="button"
                      aria-pressed={name === suggestion.name}
                      onClick={() => {
                        setName(suggestion.name);
                        setIcon(suggestion.icon);
                        setColor(suggestion.color);
                        setError(null);
                      }}
                      className={cn(
                        "shrink-0 rounded-full border px-3.5 py-2 text-sm transition-colors",
                        name === suggestion.name
                          ? "border-primary bg-accent text-accent-foreground"
                          : "border-border bg-background text-foreground hover:bg-muted",
                      )}
                    >
                      {suggestion.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">لون العادة</legend>
              <div className="grid grid-cols-9 gap-1.5">
                {HABIT_COLOR_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-label={"اللون " + option.label}
                    aria-pressed={color === option.value}
                    title={option.label}
                    onClick={() => setColor(option.value)}
                    className={cn(
                      "grid aspect-square w-full place-items-center rounded-full border-2 transition-colors",
                      color === option.value
                        ? "border-foreground/80"
                        : "border-transparent hover:border-border",
                    )}
                  >
                    <span
                      className="size-[68%] rounded-full"
                      style={{ backgroundColor: option.swatch }}
                    />
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">اختر رمزًا للعادة</legend>
              <div
                data-vaul-no-drag
                className="grid max-h-[12.5rem] grid-cols-6 gap-2 overflow-y-auto overscroll-contain p-0.5"
              >
                {HABIT_ICON_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-label={"رمز " + option.label}
                    aria-pressed={icon === option.value}
                    title={option.label}
                    onClick={() => setIcon(option.value)}
                    className={cn(
                      "grid aspect-square w-full place-items-center rounded-2xl border transition-all duration-150",
                      icon === option.value
                        ? "habit-identity border-[var(--habit-ink)]"
                        : "border-border bg-background text-muted-foreground hover:bg-muted",
                    )}
                    data-habit-color={color}
                  >
                    <HabitIcon name={option.value} className="size-6" />
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="border-t bg-card px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3">
            <Button
              type="submit"
              disabled={!canSave}
              className="h-12 w-full rounded-full text-base font-semibold"
            >
              {habit ? "حفظ التعديلات" : "إضافة العادة"}
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}

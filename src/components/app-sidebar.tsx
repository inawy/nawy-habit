import { useState } from "react";
import { Link } from "@tanstack/react-router";

import { Icon } from "@/components/icon";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const items = [
  { to: "/", label: "اليوم", icon: "home" as const },
  { to: "/archive", label: "الأرشيف", icon: "archive" as const },
  { to: "/trash", label: "سلة المحذوفات", icon: "delete" as const },
  { to: "/settings", label: "الإعدادات", icon: "settings" as const },
] as const;

export function AppSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="فتح القائمة"
          title="القائمة"
          className="habit-toolbar-action grid size-10 place-items-center rounded-full border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Icon name="menu" className="size-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" dir="rtl" className="w-[min(19rem,85vw)] border-s bg-background px-4 pt-8">
        <SheetHeader className="mb-7 text-right">
          <SheetTitle className="text-xl font-bold">عادة</SheetTitle>
          <SheetDescription>مساحتك لعاداتك اليومية</SheetDescription>
        </SheetHeader>
        <nav aria-label="القائمة الرئيسية" className="space-y-1">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted [&.active]:bg-accent [&.active]:text-primary"
              activeOptions={{ exact: item.to === "/" }}
            >
              <Icon name={item.icon} className="size-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 border-t pt-4 text-xs text-muted-foreground">ناوي</div>
      </SheetContent>
    </Sheet>
  );
}

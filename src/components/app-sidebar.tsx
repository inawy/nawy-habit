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

const primaryItems = [
  {
    to: "/",
    label: "اليوم",
    description: "تابع عاداتك اليومية",
    icon: "home" as const,
  },
  {
    to: "/archive",
    label: "الأرشيف",
    description: "العادات التي احتفظت بها",
    icon: "archive" as const,
  },
  {
    to: "/trash",
    label: "سلة المحذوفات",
    description: "استعادة العادات المحذوفة",
    icon: "delete" as const,
  },
] as const;

const secondaryItems = [
  {
    to: "/settings",
    label: "الإعدادات",
    description: "المظهر والنسخ الاحتياطي",
    icon: "settings" as const,
  },
] as const;

function NavigationItem({
  item,
  onNavigate,
}: {
  item: (typeof primaryItems)[number] | (typeof secondaryItems)[number];
  onNavigate: () => void;
}) {
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      activeOptions={{ exact: item.to === "/" }}
      activeProps={{
        className:
          "active bg-accent/80 text-primary [&_.nav-icon]:bg-primary/10 [&_.nav-icon]:text-primary",
      }}
      className="group flex min-h-[3.5rem] items-center gap-3 rounded-xl px-3 py-2 text-foreground transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <span className="nav-icon grid size-9 shrink-0 place-items-center rounded-xl bg-muted/80 text-muted-foreground transition-colors">
        <Icon name={item.icon} className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-5">{item.label}</span>
        <span className="mt-0.5 block truncate text-[11px] font-normal text-muted-foreground">
          {item.description}
        </span>
      </span>
      <span
        aria-hidden="true"
        className="size-1.5 shrink-0 rounded-full bg-primary opacity-0 transition-opacity group-[.active]:opacity-100"
      />
    </Link>
  );
}

export function AppSidebar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="فتح القائمة الجانبية"
          aria-haspopup="dialog"
          aria-expanded={open}
          title="القائمة"
          className="habit-toolbar-action grid size-10 shrink-0 place-items-center rounded-xl border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Icon name="menu" className="size-5" />
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        dir="rtl"
        className="w-[min(20rem,88vw)] gap-0 border-s bg-background p-0 shadow-2xl sm:w-80"
      >
        <SheetHeader className="border-b px-4 pb-5 pt-7 text-right">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
              <span className="size-2.5 rounded-full bg-current" />
            </span>
            <span className="min-w-0">
              <SheetTitle className="text-lg font-bold tracking-tight">عادة</SheetTitle>
              <SheetDescription className="mt-0.5 text-xs">مساحتك لعاداتك اليومية</SheetDescription>
            </span>
          </div>
        </SheetHeader>

        <nav aria-label="القائمة الرئيسية" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-bold tracking-wide text-muted-foreground">
            مساحتي
          </p>
          {primaryItems.map((item) => (
            <NavigationItem key={item.to} item={item} onNavigate={close} />
          ))}

          <div className="my-4 border-t" />

          <p className="mb-2 px-3 text-[10px] font-bold tracking-wide text-muted-foreground">
            التطبيق
          </p>
          {secondaryItems.map((item) => (
            <NavigationItem key={item.to} item={item} onNavigate={close} />
          ))}
        </nav>

        <div className="border-t px-4 py-4">
          <p className="text-xs font-medium text-foreground">بياناتك في أمان على جهازك</p>
          <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
            عادة من ناوي · تجربة بسيطة تحترم خصوصيتك
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

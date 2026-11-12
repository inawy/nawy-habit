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
          "active bg-accent text-primary ring-1 ring-inset ring-primary/10 [&_.nav-icon]:bg-primary/10 [&_.nav-icon]:text-primary",
      }}
      className="group flex min-h-[3.75rem] items-center gap-3 rounded-2xl px-3 py-2 text-foreground transition-colors duration-150 hover:bg-muted focus-visible:outline-offset-2"
    >
      <span className="nav-icon grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground transition-colors">
        <Icon name={item.icon} className="size-[1.3rem]" />
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
          title="القائمة"
          className="habit-toolbar-action grid size-10 place-items-center rounded-full border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Icon name="menu" className="size-5" />
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        dir="rtl"
        className="w-[min(21rem,88vw)] gap-0 border-s bg-background p-0"
      >
        <SheetHeader className="border-b px-5 pb-5 pt-8 text-right">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <span className="size-2.5 rounded-full bg-current" />
            </span>
            <span className="min-w-0">
              <SheetTitle className="text-xl font-bold tracking-tight">عادة</SheetTitle>
              <SheetDescription className="mt-0.5 text-xs">مساحتك لعاداتك اليومية</SheetDescription>
            </span>
          </div>
        </SheetHeader>

        <nav aria-label="القائمة الرئيسية" className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
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

        <div className="border-t px-5 py-4">
          <p className="text-xs font-medium text-foreground">بياناتك في أمان على جهازك</p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            عادة من ناوي · تجربة بسيطة تحترم خصوصيتك
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

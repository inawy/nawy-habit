import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";

import { Icon } from "@/components/icon";
import { consumeSidebarReturn, markSidebarReturn } from "@/lib/navigation/sidebar-return";
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
      onClick={() => {
        // Leaving for another section: coming back should reopen this menu.
        if (item.to !== "/") markSidebarReturn();
        onNavigate();
      }}
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
  const [swipeClosing, setSwipeClosing] = useState(false);
  // True when the menu is restored after coming back from a section: it must already be there,
  // not slide in front of the user.
  const [restored, setRestored] = useState(false);
  const swipe = useRef<{
    x: number;
    y: number;
    lastX: number;
    lastTime: number;
    dragging: boolean;
  } | null>(null);
  const swiped = useRef(false);
  const close = () => setOpen(false);

  // Back from a section opened through this menu: show the menu already open, before the first
  // paint and without the slide-in/fade-in animation. Closing it animates as usual.
  useLayoutEffect(() => {
    if (!consumeSidebarReturn()) return;
    setRestored(true);
    setOpen(true);
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    const target = event.target;
    if (
      target instanceof HTMLElement &&
      target.closest("button, input, textarea, select, [contenteditable='true'], [data-no-swipe]")
    ) {
      swipe.current = null;
      return;
    }

    swipe.current = {
      x: event.clientX,
      y: event.clientY,
      lastX: event.clientX,
      lastTime: event.timeStamp,
      dragging: false,
    };
  };

  const resetSwipeStyle = (element: HTMLDivElement, animate = true) => {
    element.style.transition = animate ? "transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)" : "none";
    element.style.transform = "translate3d(0, 0, 0)";
    if (animate) {
      window.setTimeout(() => {
        element.style.transition = "";
        element.style.transform = "";
      }, 240);
    } else {
      element.style.transition = "";
      element.style.transform = "";
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = swipe.current;
    if (!current) return;

    const deltaX = event.clientX - current.x;
    const deltaY = event.clientY - current.y;

    if (!current.dragging) {
      // Let normal vertical scrolling win; only take over a clear rightward gesture.
      if (Math.abs(deltaY) > 10 && Math.abs(deltaY) > Math.abs(deltaX)) {
        swipe.current = null;
        return;
      }
      if (deltaX < 8 || deltaX < Math.abs(deltaY) * 1.15) return;

      current.dragging = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    event.preventDefault();
    const offset = Math.max(0, deltaX);
    event.currentTarget.style.transition = "none";
    event.currentTarget.style.transform = `translate3d(${offset}px, 0, 0)`;
    current.lastX = event.clientX;
    current.lastTime = event.timeStamp;
  };

  const finishSwipe = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = swipe.current;
    swipe.current = null;
    if (!current?.dragging) return;

    const element = event.currentTarget;
    const deltaX = Math.max(0, event.clientX - current.x);
    const elapsed = Math.max(1, event.timeStamp - current.lastTime);
    const velocity = Math.max(0, (event.clientX - current.lastX) / elapsed);
    const threshold = Math.max(72, element.getBoundingClientRect().width * 0.28);

    if (deltaX >= threshold || (deltaX > 34 && velocity > 0.55)) {
      swiped.current = true;
      // Finish the same finger-following motion, then close without Radix's
      // second slide-out animation (which would make the panel jump backward).
      setSwipeClosing(true);
      element.style.transition = "transform 150ms cubic-bezier(0.2, 0.8, 0.2, 1)";
      element.style.transform = "translate3d(100%, 0, 0)";
      window.setTimeout(close, 150);
      return;
    }

    resetSwipeStyle(element);
  };

  const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!swiped.current) return;
    event.preventDefault();
    event.stopPropagation();
    swiped.current = false;
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setSwipeClosing(false);
          setRestored(false);
        }
      }}
    >
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
        closeButtonClassName="left-4 right-auto"
        overlayClassName={restored ? "data-[state=open]:!animate-none" : undefined}
        className={`w-[min(20rem,88vw)] touch-pan-y gap-0 border-s bg-background p-0 shadow-2xl sm:w-80 ${
          swipeClosing ? "data-[state=closed]:!animate-none" : ""
        } ${restored ? "data-[state=open]:!animate-none" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishSwipe}
        onPointerCancel={(event) => {
          swipe.current = null;
          resetSwipeStyle(event.currentTarget);
        }}
        onClickCapture={handleClickCapture}
      >
        <SheetHeader className="border-b px-4 pb-5 pt-7 text-right">
          <div className="flex items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL}icon.svg`}
              alt=""
              width={40}
              height={40}
              decoding="async"
              className="size-10 shrink-0"
            />
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

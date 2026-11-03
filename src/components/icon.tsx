import add from "@/assets/icons/add.svg?url";
import autoAwesome from "@/assets/icons/auto_awesome.svg?url";
import bedtime from "@/assets/icons/bedtime.svg?url";
import calendarMonth from "@/assets/icons/calendar_month.svg?url";
import check from "@/assets/icons/check.svg?url";
import chevronLeft from "@/assets/icons/chevron_left.svg?url";
import chevronRight from "@/assets/icons/chevron_right.svg?url";
import directionsWalk from "@/assets/icons/directions_walk.svg?url";
import favorite from "@/assets/icons/favorite.svg?url";
import fitnessCenter from "@/assets/icons/fitness_center.svg?url";
import gridView from "@/assets/icons/grid_view.svg?url";
import localFireDepartment from "@/assets/icons/local_fire_department.svg?url";
import menuBook from "@/assets/icons/menu_book.svg?url";
import moreHoriz from "@/assets/icons/more_horiz.svg?url";
import notifications from "@/assets/icons/notifications.svg?url";
import restaurant from "@/assets/icons/restaurant.svg?url";
import accountBalanceWallet from "@/assets/icons/account_balance_wallet.svg?url";
import school from "@/assets/icons/school.svg?url";
import selfImprovement from "@/assets/icons/self_improvement.svg?url";
import viewCompact from "@/assets/icons/view_compact.svg?url";
import viewList from "@/assets/icons/view_list.svg?url";
import volunteerActivism from "@/assets/icons/volunteer_activism.svg?url";
import waterDrop from "@/assets/icons/water_drop.svg?url";
import settings from "@/assets/icons/settings.svg?url";
import { cn } from "@/lib/utils";

const icons = {
  add,
  auto_awesome: autoAwesome,
  bedtime,
  calendar_month: calendarMonth,
  check,
  chevron_left: chevronLeft,
  chevron_right: chevronRight,
  directions_walk: directionsWalk,
  favorite,
  fitness_center: fitnessCenter,
  grid_view: gridView,
  local_fire_department: localFireDepartment,
  menu_book: menuBook,
  more_horiz: moreHoriz,
  notifications,
  restaurant,
  account_balance_wallet: accountBalanceWallet,
  school,
  self_improvement: selfImprovement,
  settings,
  view_compact: viewCompact,
  view_list: viewList,
  volunteer_activism: volunteerActivism,
  water_drop: waterDrop,
} as const;

export type IconName = keyof typeof icons;

interface IconProps {
  name: IconName;
  className?: string;
}

/**
 * Locally vendored Material Symbols, rendered as a mask so currentColor works
 * in both themes without a runtime icon font or third-party icon package.
 */
export function Icon({ name, className }: IconProps) {
  const source = icons[name];
  const mask = `url("${source}")`;

  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-5 shrink-0 bg-current", className)}
      style={{
        maskImage: mask,
        WebkitMaskImage: mask,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
        maskSize: "contain",
        WebkitMaskSize: "contain",
      }}
    />
  );
}

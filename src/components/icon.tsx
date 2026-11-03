import check from "@/assets/icons/check.svg?url";
import chevronLeft from "@/assets/icons/chevron_left.svg?url";
import chevronRight from "@/assets/icons/chevron_right.svg?url";
import localFireDepartment from "@/assets/icons/local_fire_department.svg?url";
import moreHoriz from "@/assets/icons/more_horiz.svg?url";
import notifications from "@/assets/icons/notifications.svg?url";
import settings from "@/assets/icons/settings.svg?url";
import { cn } from "@/lib/utils";

const icons = {
  check,
  chevron_left: chevronLeft,
  chevron_right: chevronRight,
  local_fire_department: localFireDepartment,
  more_horiz: moreHoriz,
  notifications,
  settings,
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

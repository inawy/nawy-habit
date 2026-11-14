import { Link, useRouter } from "@tanstack/react-router";

import { Icon } from "@/components/icon";
import { hasPendingSidebarReturn } from "@/lib/navigation/sidebar-return";

/** A predictable RTL back affordance for top-level app sections. */
export function PageBackButton() {
  const router = useRouter();

  return (
    <Link
      to="/"
      onClick={(event) => {
        // Opened from the side menu: step back in history so the menu reopens on the previous
        // screen, exactly like the system back button, instead of stacking a new entry.
        if (hasPendingSidebarReturn() && window.history.length > 1) {
          event.preventDefault();
          router.history.back();
        }
      }}
      aria-label="العودة إلى اليوم"
      title="العودة إلى اليوم"
      className="grid size-10 shrink-0 place-items-center rounded-full border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Icon name="chevron_right" className="size-5" />
    </Link>
  );
}

import { Link } from "@tanstack/react-router";

import { Icon } from "@/components/icon";

/** A predictable RTL back affordance for top-level app sections. */
export function PageBackButton() {
  return (
    <Link
      to="/"
      aria-label="العودة إلى اليوم"
      title="العودة إلى اليوم"
      className="grid size-10 shrink-0 place-items-center rounded-full border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Icon name="chevron_right" className="size-5" />
    </Link>
  );
}

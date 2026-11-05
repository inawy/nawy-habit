import type { ReactNode } from "react";
import { useCanGoBack, useRouter } from "@tanstack/react-router";

interface AppBackButtonProps {
  label: string;
  className: string;
  children: ReactNode;
  fallbackTo?: "/";
}

/**
 * Returns to the previous in-app location when one exists.
 * Directly opened routes fall back to the app home instead of leaving the app.
 */
export function AppBackButton({
  label,
  className,
  children,
  fallbackTo = "/",
}: AppBackButtonProps) {
  const canGoBack = useCanGoBack();
  const router = useRouter();

  const handleBack = () => {
    if (canGoBack) {
      router.history.back();
      return;
    }

    void router.navigate({ to: fallbackTo });
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={label}
      title={label}
      className={className}
    >
      {children}
    </button>
  );
}

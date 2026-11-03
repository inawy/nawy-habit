import { useEffect, useState } from "react";

import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const STANDALONE_QUERY = "(display-mode: standalone)";

function isStandaloneApp(): boolean {
  if (typeof window === "undefined") return false;
  const displayMode = window.matchMedia(STANDALONE_QUERY).matches;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return displayMode || iosStandalone;
}

function isTopLevelProductionPage(): boolean {
  if (typeof window === "undefined" || !import.meta.env.PROD) return false;
  try {
    return window.self === window.top;
  } catch {
    return false;
  }
}

export function InstallAppButton() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    if (!isTopLevelProductionPage()) return;

    const markInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setHelpOpen(false);
    };

    if (isStandaloneApp()) {
      markInstalled();
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => markInstalled();
    const displayMode = window.matchMedia(STANDALONE_QUERY);
    const handleDisplayModeChange = (event: MediaQueryListEvent) => {
      if (event.matches) markInstalled();
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    displayMode.addEventListener("change", handleDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      displayMode.removeEventListener("change", handleDisplayModeChange);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      setHelpOpen(true);
      return;
    }

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "dismissed") setInstallPrompt(null);
    } catch {
      setInstallPrompt(null);
      setHelpOpen(true);
    }
  };

  if (!isTopLevelProductionPage() || isInstalled) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => void handleInstall()}
        aria-label="تثبيت ناوي كتطبيق"
        title="تثبيت التطبيق"
        className="habit-toolbar-action grid size-10 place-items-center rounded-full border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Icon name="install_mobile" className="size-5" />
      </button>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle>تثبيت ناوي كتطبيق</DialogTitle>
            <DialogDescription>
              أضف ناوي للشاشة الرئيسية وافتحه كتطبيق مستقل على جهازك.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              <span className="font-semibold text-foreground">على الكمبيوتر:</span>{" "}
              افتح قائمة المتصفح واختر «تثبيت ناوي للعادات» أو «Install app».
            </p>
            <p>
              <span className="font-semibold text-foreground">على الموبايل:</span>{" "}
              افتح قائمة المشاركة أو قائمة المتصفح واختر «إضافة إلى الشاشة الرئيسية».
            </p>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setHelpOpen(false)}>
              تمام
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

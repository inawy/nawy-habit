import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { registerServiceWorker } from "../lib/pwa/register-sw";
import { permanentlyDeleteExpiredHabits } from "../lib/db/habits-repo";
import { ThemeProvider } from "../lib/theme/theme-provider";
import { useTheme } from "../lib/theme/theme-context";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div
          className="mx-auto grid size-12 place-items-center rounded-full bg-muted text-sm font-semibold text-muted-foreground"
          aria-hidden
        >
          404
        </div>
        <h2 className="mt-4 text-xl font-semibold text-foreground">الصفحة مش موجودة</h2>
        <p className="mt-2 text-sm text-muted-foreground">يمكن الرابط اتغيّر أو اتكتب غلط.</p>
        <div className="mt-6">
          <Link
            to="/"
            replace
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-pressed"
          >
            الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">الصفحة ما فتحتش</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          حصلت مشكلة. بياناتك سليمة على جهازك — جرّب تاني أو ارجع للرئيسية.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-pressed"
          >
            حاول تاني
          </button>
          <Link
            to="/"
            replace
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "author", content: "Nawy" },
      { name: "theme-color", content: "#F7F8FA" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: `${import.meta.env.BASE_URL}favicon.png`, type: "image/png" },
      { rel: "apple-touch-icon", href: `${import.meta.env.BASE_URL}apple-touch-icon.png` },
      { rel: "manifest", href: `${import.meta.env.BASE_URL}manifest.webmanifest` },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var p=localStorage.getItem('nawy-habit-theme');var dark=p==='dark'||(p!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var t=dark?'dark':'light';var r=document.documentElement;r.dataset.theme=t;r.classList.toggle('dark',dark);r.style.colorScheme=t;var m=document.querySelector('meta[name=theme-color]');if(m)m.setAttribute('content',dark?'#121212':'#F7F8FA');}catch(e){}})();",
          }}
        />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    void permanentlyDeleteExpiredHabits().catch((error) => {
      console.error("Trash cleanup failed.", error);
    });
    void registerServiceWorker().catch((error) => {
      console.error("Service worker startup failed.", error);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RootContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function RootContent() {
  const { resolvedTheme } = useTheme();

  return (
    <>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster position="top-center" dir="rtl" theme={resolvedTheme} />
    </>
  );
}

import { useEffect, useState, type ReactNode } from "react";

import { ThemeContext, type ResolvedTheme, type ThemePreference } from "./theme-context";

const STORAGE_KEY = "nawy-habit-theme";

function readSavedTheme(): ThemePreference {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark" || saved === "system") return saved;
  } catch {
    // Private browsing or storage restrictions should not prevent the app from opening.
  }
  return "system";
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(preference: ThemePreference) {
  const resolved = preference === "system" ? getSystemTheme() : preference;
  const root = document.documentElement;

  root.dataset["theme"] = resolved;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;

  const themeColor = resolved === "dark" ? "#121212" : "#F7F8FA";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColor);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemePreference>("system");
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTheme(readSavedTheme());
    setReady(true);
  }, []);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return;

    const syncSystemTheme = () => setSystemTheme(media.matches ? "dark" : "light");
    syncSystemTheme();
    media.addEventListener?.("change", syncSystemTheme);
    return () => media.removeEventListener?.("change", syncSystemTheme);
  }, []);

  useEffect(() => {
    if (!ready) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // The selected theme still works for this session when storage is unavailable.
    }

    applyTheme(theme);
  }, [ready, theme, systemTheme]);

  // Keep the first server and client render stable; the bootstrap script sets the real theme
  // before paint, and this value catches up as soon as the provider mounts.
  const resolvedTheme = theme === "system" ? systemTheme : theme;

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

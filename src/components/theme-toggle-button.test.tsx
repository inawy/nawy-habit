import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { ThemeContext, type ResolvedTheme } from "@/lib/theme/theme-context";

function setup(resolvedTheme: ResolvedTheme) {
  const setTheme = vi.fn();
  render(
    <ThemeContext.Provider value={{ theme: "system", resolvedTheme, setTheme }}>
      <ThemeToggleButton />
    </ThemeContext.Provider>,
  );
  return setTheme;
}

describe("ThemeToggleButton", () => {
  it("switches a light theme to dark", () => {
    const setTheme = setup("light");
    fireEvent.click(screen.getByRole("button", { name: "التبديل إلى الوضع الليلي" }));
    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("switches a dark theme to light", () => {
    const setTheme = setup("dark");
    fireEvent.click(screen.getByRole("button", { name: "التبديل إلى الوضع النهاري" }));
    expect(setTheme).toHaveBeenCalledWith("light");
  });
});

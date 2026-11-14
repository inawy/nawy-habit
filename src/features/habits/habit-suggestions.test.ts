import { describe, expect, it } from "vitest";

import { habitInputSchema } from "@/lib/db/schema";

import { HABIT_SUGGESTIONS } from "./habit-suggestions";

describe("habit suggestions", () => {
  it("are valid habit inputs with unique names", () => {
    for (const suggestion of HABIT_SUGGESTIONS) {
      const result = habitInputSchema.safeParse({
        name: suggestion.name,
        emoji: "✨",
        icon: suggestion.icon,
        color: suggestion.color,
      });
      expect(result.success, suggestion.name).toBe(true);
    }
    expect(new Set(HABIT_SUGGESTIONS.map((suggestion) => suggestion.name)).size).toBe(
      HABIT_SUGGESTIONS.length,
    );
  });
});

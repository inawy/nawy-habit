import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("matches the habit detail page", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/habit/abc-123");

    expect(matches.at(-1)?.routeId).toBe("/habit/$habitId");
  });

  it("replaces the current history entry when returning from settings", async () => {
    const history = createMemoryHistory({ initialEntries: ["/", "/settings"] });
    const router = createRouter({
      routeTree,
      history,
      context: { queryClient: new QueryClient() },
    });

    await router.navigate({ to: "/", replace: true });

    expect(history.location.pathname).toBe("/");
    expect(history.length).toBe(2);
  });
});

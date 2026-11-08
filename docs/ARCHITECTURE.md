# Nawy Habit — Architecture

## Product boundary

Nawy Habit is an independent, local-first habit tracker in the Nawy product family. Core habit creation, check-ins, history, and progress do not require an account, network request, or custom backend.

## Actual runtime and framework

The current application uses the following project-specific stack (verified against package.json):

- React 19
- TypeScript 5.8
- TanStack Start v1 with TanStack Router file routes
- Vite 8
- Tailwind CSS 4
- Bun and the committed bun.lock
- Dexie 4 + IndexedDB
- Zod 3
- Vitest 4 + Testing Library
- vite-plugin-pwa / Workbox

This project predates the current Nawy starter baseline and retains TanStack Start and Bun. Do not interpret this as approval to copy that framework/package-manager choice into new Nawy products. New products should start from the current [Nawy React + Vite starter](https://github.com/inawy/design-system/tree/main/starter/react-vite), unless their requirements justify another architecture.

## Data flow

- UI components call feature hooks and repository functions.
- `src/lib/db/*-repo.ts` contains Dexie access.
- `src/lib/date` and `src/lib/habits` contain pure date and progress logic.
- IndexedDB database name: `nawy-habit`.
- Current Dexie schema version: v4. Released versions are immutable; changes require a new version and an explicit upgrade.
- Current JSON backup format: v4. Import upgrades supported v1-v3 backup files before validation.
- Habit logs use local calendar keys (`YYYY-MM-DD`).
- JSON export/import validates timestamps, IDs, log references, and duplicates before replacement.
- Import replaces habits and logs in one Dexie transaction; invalid data must never clear existing records.
- The legacy `Habit.emoji` field remains persisted for compatibility, but the UI no longer displays or edits it. Removing it requires a Dexie migration and backup conversion.

## Navigation and history

- Return links from settings and habit details replace the current history entry instead of pushing another copy of the home route. The root-level not-found and error recovery links also replace the current entry, avoiding stale error screens in the Back stack.
- Opening settings from the home screen remains a normal push, so the system Back button returns to the home screen as expected.

## Network, hosting, and PWA

- GitHub Pages serves the static SPA from the custom-domain root (`/`), not a repository subpath.
- `GH_PAGES=1` directs the PWA build output to `.output/public`, the directory that the Pages workflow publishes. The existing Lovable/editor build continues to use its separate `dist/client` PWA output.
- The Pages workflow validates that `sw.js`, the Workbox runtime, hashed application assets, and the app shell are present before deployment.
- The service worker is registered only in production, outside editor previews and iframes.
- Hashed application assets and the offline shell are precached. Navigations use NetworkFirst, with the cached app shell as a fallback when a route has not been visited before and the device is offline.
- Core records are not sent to a remote service by the current repository.
- There is no authentication, cloud database, sync engine, or cross-product shared database.
- Cairo currently loads from Google Fonts; Workbox has runtime font caching, but the font is not bundled for first-load offline use. The app uses system font fallbacks.
- The first successful online visit is required to install the service worker and populate its caches; offline use cannot be guaranteed before that visit.

## Known limitations

- Reminder checks are driven by a timer while the page is open and active. They are not guaranteed after the page/browser is closed or suspended.
- Cross-tab coordination for reminder slots is not fully guaranteed.
- The PWA PNG icon artwork has not yet been brought into alignment with the current Nawy brand.
- Full English/LTR support and comprehensive accessibility verification remain open.
- Browser-level verification of installation, offline navigation, service-worker updates, and data persistence is required on Chrome desktop, Android Chrome, and Samsung Internet before production sign-off.

## Quality commands

```sh
bun run lint
bun run typecheck
bun run test
bun run build
bun run check
```

GitHub Actions runs lint, typecheck, tests, and production build for push and pull-request events. The GitHub Pages workflow separately validates the static PWA output before deploying it.

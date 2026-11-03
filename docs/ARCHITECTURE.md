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
- Current schema version: Dexie v1.
- Habit logs use local calendar keys (`YYYY-MM-DD`).
- JSON export/import validates payloads with Zod.
- The legacy `Habit.emoji` field remains persisted for compatibility, but the UI no longer displays or edits it. A later removal must include a Dexie migration and v1 backup conversion.

## Network, hosting, and PWA

- GitHub Pages is built as a static SPA under `/nawy-habit/`.
- Lovable hosting is also retained for the existing editor workflow.
- The service worker is registered only in production.
- Core records are not sent to a remote service by the current repository.
- There is no authentication, cloud database, sync engine, or cross-product shared database.
- Cairo currently loads from Google Fonts; Workbox has runtime font caching, but the font is not bundled for first-load offline use.

## Known limitations

- Reminder checks are driven by a timer while the page is open or active in the browser. This is not a guaranteed alarm after the page/browser is closed or suspended.
- Cross-tab coordination for reminder slots is not fully guaranteed.
- The PWA PNG icon artwork has not yet been brought into alignment with the current Nawy brand.
- Full English/LTR support and comprehensive accessibility verification remain open.

## Quality commands

```sh
bun run lint
bun run typecheck
bun run test
bun run build
bun run check
```

GitHub Actions runs lint, typecheck, tests, and production build for push and pull-request events.

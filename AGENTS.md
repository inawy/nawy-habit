# AGENTS.md — Nawy Habit

Local-first, offline-capable, mobile-first habit tracker in the Nawy ecosystem. Full product brief: docs/product-brief.md — read it before product or UX changes.

## Rules

- Framework is TanStack Start v1 (React 19 + Vite 7 + TypeScript), file routes in src/routes — fixed by the platform, never add react-router.
- Core data lives in IndexedDB via Dexie (+ dexie-react-hooks) — local-first, no backend for core features.
- Validate persisted data and import/export payloads with Zod — guards against corrupt or old-schema data.
- Store habit logs by local calendar key (YYYY-MM-DD), not timestamps — avoids timezone streak bugs.
- Dexie schema changes only via versioned db.version(n).upgrade() — user data must survive updates.
- PWA via vite-plugin-pwa (generateSW), registered only in production, never in preview — prevents stale caches.
- Before adding a dependency, compare open-source alternatives (size, maintenance, license); prefer built-ins — keeps the app light.
- UI never calls Dexie directly: data access goes through src/lib/db/*-repo.ts; pure logic (dates, streaks) lives in src/lib and is unit-tested — keeps storage swappable and logic testable.
- Feature UI lives in src/features/<feature>; shadcn primitives in src/components/ui are excluded from lint.
- `bun run check` (lint + typecheck + tests) must pass; CI runs it plus build on every push — no merging red.
- UI is Arabic RTL first (html dir="rtl"); use logical spacing (ms/me/start/end) so LTR can be added later.
- All user-visible numbers and date formats go through src/lib/format/numbers.ts (ar-u-nu-latn) — one digit style everywhere, because bare toLocaleString("ar") renders different digits per device.
- Service worker is registered only via src/lib/pwa/register-sw.ts (guards dev, iframe, preview hosts, ?sw=off); HTML is NetworkFirst — never cache-first, so updates always reach users.
- Habit history grids share HabitActivityGrid and derive cells from local day-key helpers, with no extra persisted state or chart dependency — keeps Today and detail views consistent and offline-safe.
- Daily reminders are local-only: fixed slots (max 3/day) in src/lib/reminders, no user-configurable times, and the UI never implies times are adjustable — keeps the local-first promise and honest UX.

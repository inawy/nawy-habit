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

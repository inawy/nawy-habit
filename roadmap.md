# Roadmap — Nawy Habit

- [x] Phase 0 — lint/typecheck/test scripts, CI, design tokens, Arabic RTL
- [x] Phase 1 — Dexie DB v1, Zod schemas, repository, day keys + streaks with tests
- [x] Phase 2 — add/edit/archive habits, one-tap check-in, streaks on Today screen
- [x] Phase 3 — habit detail page: monthly calendar + consistency rate
- [x] Phase 4 — JSON export/import, persistent storage request, migration tests
- [x] Phase 5 — PWA install + offline (vite-plugin-pwa, production only)
- [x] Phase 6 — Arabic error/404 pages, a11y + mobile check
- [x] Publish — live at https://nawy-habit.lovable.app (URL renamed from myhabit-vault)
- [x] Habit Kit inspiration — reviewed repos (HabitKit app is closed-source; used jcortesdev/habit-tracker ideas) and shipped the 12-week achievement grid per habit. GitHub sync and publish re-verified (commit 31c4b28, https://nawy-habit.lovable.app → 200).
- [x] GitHub Pages copy — workflow ready; user must set Pages source to "GitHub Actions".
- [ ] Local reminders — resolve storage/cross-tab cap safety and page-timer limitations; verify permission and real delivery before calling production-ready.
- [x] Explain local-notification limits and optional Cloud costs/hosting without enabling Cloud.
- [x] Design-system alignment — Nawy Blue, Cairo, local Material Symbols SVG, logical form/floating-action alignment, global focus-visible and reduced-motion defaults. Remaining visual/accessibility verification is listed in docs/design-audit.md.

- [x] Fair monthly consistency — count from habit creation, with regression tests.
- [x] Safer backups — validate dates, duplicates and log references; preserve data on failure and offer a backup before replacement. Verified downloads and replacement readback through the UI.
- [x] Today usability — preserved view choices and grids; add control follows content instead of covering it; verified mobile and desktop.

# Nawy Habit — Design-system alignment

Reference: [inawy/design-system](https://github.com/inawy/design-system), reviewed against the current documented brand decisions.

## Implemented in this alignment pass

- Primary brand color changed to Nawy Blue `#3D7BFF` across semantic theme tokens, document theme color, and PWA manifest.
- Arabic font changed from IBM Plex Sans Arabic to Cairo.
- Functional Lucide/emoji UI icons replaced with locally vendored Google Material Symbols — Outlined SVG assets.
- SVG assets are stored in `src/assets/icons`, include the upstream Apache-2.0 license, and render through a small currentColor mask component.
- Visible decorative emoji were removed from empty, error, reminder, and habit surfaces. Habit identity now uses the Nawy dot motif.
- Form alignment and the floating primary action use logical alignment where applicable.
- Global `:focus-visible` treatment and `prefers-reduced-motion` support were added.
- Placeholder number style now follows the app's Latin-digit formatting convention.

## Deliberate compatibility choices

- The persisted `Habit.emoji` field is retained but no longer rendered or edited. Existing local databases and v1 JSON backups remain readable; removing or renaming this field requires a versioned Dexie migration and backup conversion.
- The app remains on TanStack Start + Bun for this release. This is a product-specific existing architecture, not the default starting point for new Nawy apps. See [docs/ARCHITECTURE.md](./ARCHITECTURE.md).
- Cairo is currently loaded from Google Fonts and is not bundled. The system fallback remains available, but the exact Cairo face may not be present on a first offline load.
- The PWA manifest colors are aligned; the PNG app icon artwork was not redesigned in this change.

## Remaining verification

- Run visual checks on a small phone and a wide viewport, including Arabic/Latin mixed content.
- Verify WCAG 2.2 AA contrast for every component state, plus keyboard navigation, 200% zoom, touch targets, and safe-area behavior.
- English/LTR is not yet an implemented product mode.
- Confirm the exact Cairo font loading and fallback behavior on a clean offline install.
- Revisit PWA icon artwork so the installed app icon matches the Nawy visual identity.
- Local reminders remain a page-timer implementation, not a guaranteed background alarm. Closed or suspended pages cannot guarantee delivery; cross-tab limits and actual notification delivery still require work.

## Result

Core visual brand foundations and interaction defaults are now aligned in code. This is not a claim that the full application has passed a comprehensive accessibility or production-readiness audit.

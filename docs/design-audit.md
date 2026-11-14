# Nawy Habit — Design-system alignment

Reference: [inawy/design-system](https://github.com/inawy/design-system), reviewed against the current documented brand decisions.

## Implemented in this alignment pass

- Primary brand color changed to Nawy Blue `#3D7BFF` across semantic theme tokens, document theme color, and PWA manifest.
- Arabic font changed from IBM Plex Sans Arabic to Cairo.
- Functional Lucide/emoji UI icons replaced with locally vendored Google Material Symbols — Outlined SVG assets.
- SVG assets are stored in `src/assets/icons`, include the upstream Apache-2.0 license, and render through a small currentColor mask component.
- Visible decorative emoji were removed from empty, error, reminder, and habit surfaces. Habit identity now uses the Nawy dot motif.
- The floating add action is a circular, icon-only Nawy-style button with a clear accessible label.
- New habits can choose from a curated set of local Google Material Symbols and eight identity colors.
- Existing habits receive a default icon/color through a Dexie v2 migration; v1 JSON backups are upgraded during import without dropping their historical emoji field.
- Light, dark, and system appearance preferences are stored locally and applied before the first paint to avoid a theme flash.
- Form alignment and the floating primary action use logical alignment where applicable.
- Global `:focus-visible` treatment and `prefers-reduced-motion` support were added.
- Placeholder number style now follows the app's Latin-digit formatting convention.

## Deliberate compatibility choices

- The persisted `Habit.emoji` field is retained but no longer rendered or edited. Existing local databases and v1 JSON backups remain readable; removing or renaming this field requires a versioned Dexie migration and backup conversion.
- The app remains on TanStack Start + Bun for this release. This is a product-specific existing architecture, not the default starting point for new Nawy apps. See [docs/ARCHITECTURE.md](./ARCHITECTURE.md).
- Cairo is currently loaded from Google Fonts and is not bundled. The system fallback remains available, but the exact Cairo face may not be present on a first offline load.
- The PWA manifest colors are aligned; the PNG app icon artwork was not redesigned in this change.

## Remaining verification

- Run visual checks on a small phone and a wide viewport in light, dark, and system appearance modes, including Arabic/Latin mixed content.
- Confirm the theme follows OS changes only while the preference is set to «حسب الجهاز».
- Verify WCAG 2.2 AA contrast for every component state, plus keyboard navigation, 200% zoom, touch targets, and safe-area behavior.
- English/LTR is not yet an implemented product mode.
- Confirm the exact Cairo font loading and fallback behavior on a clean offline install.
- ~~Revisit PWA icon artwork~~ Done: new "Noon Grid" icon, see docs/app-icon.md.
- Local reminders remain a page-timer implementation, not a guaranteed background alarm. Closed or suspended pages cannot guarantee delivery; cross-tab limits and actual notification delivery still require work.

## Result

Core visual brand foundations and interaction defaults are now aligned in code. This is not a claim that the full application has passed a comprehensive accessibility or production-readiness audit.

## Contrast follow-up

The first alignment pass used the literal Nawy Blue `#3D7BFF` as a filled-control background with dark labels. Although the dark foreground exceeded 4.5:1 contrast, its near-black appearance was visually harsh and did not match the intended Nawy button treatment.

The interaction palette now separates brand identity from filled-control contrast:

- Brand accent / focus ring / document theme color: `#3D7BFF`.
- Filled primary controls: `#2F6CEB` with white labels (approximately 4.70:1 contrast).
- Hover / pressed controls: `#2459CC` with white labels (approximately 6.22:1 contrast).

This keeps Nawy Blue as the recognizable brand color while using its documented darker interaction shades for white-on-blue text. Contrast values are calculated for opaque sRGB colors; translucent/disabled states still require review in the rendered UI.

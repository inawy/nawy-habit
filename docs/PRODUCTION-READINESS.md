# Nawy Habit — Production Readiness

This checklist is the release gate for `ada.nawy.app`. Do not mark the app production-ready based on a successful compile alone. The release is complete only after the automated and real-device checks below pass.

## 1. Deployment and PWA reliability

- [x] Build GitHub Pages assets for the custom-domain root (`/`).
- [x] Generate the service worker and Workbox runtime in the directory that GitHub Pages actually publishes.
- [x] Precache hashed application assets and the static app shell.
- [x] Keep navigations NetworkFirst and use the precached app shell if a route has not been visited before and the network is unavailable.
- [x] Make the Pages workflow fail if the shell, service worker, Workbox runtime, or precached assets are missing.
- [x] Keep automatic service-worker updates enabled and clean outdated caches.
- [x] Catch service-worker registration errors without preventing the app from starting.
- [x] Verify CI and the GitHub Pages deployment for the current commit.
- [x] Run a post-deployment HTTP smoke test against `https://ada.nawy.app/` for the homepage, manifest, icon dimensions, service worker, built assets, app shell, and `/settings` deep link.

The post-deployment check is implemented in `scripts/smoke-pages.mjs` and runs immediately after `actions/deploy-pages`. It verifies the live response, but it does not replace real browser installation, offline, or IndexedDB-retention tests.

## 2. User data and recovery

- [x] Keep core records in IndexedDB through Dexie; do not add a remote database or account requirement.
- [x] Keep database upgrades versioned (current schema: v4).
- [x] Validate backup timestamps, IDs, references, and duplicate records.
- [x] Upgrade supported v1-v3 backup files to the current v4 format.
- [x] Replace data atomically so a failed import does not leave the database empty or partially replaced.
- [x] Run automated repository, migration, and backup tests in CI.
- [ ] On a real browser, create habits and history, export a backup, clear only the app's test profile, and restore it.
- [ ] Verify a v1/v2/v3 backup from an earlier release restores correctly.
- [ ] Verify existing on-device records survive an app update without being reset.
- [ ] Confirm the storage-persistence prompt behaves correctly when accepted, declined, or unavailable.

## 3. Core behavior and reminders

- [x] Create, edit, archive, restore, and record habit completion.
- [x] Review past days, monthly history, yearly activity, and streaks.
- [x] Keep reminder slots local and limited to three per day.
- [x] Do not mark a reminder slot as consumed when the browser fails to display the notification.
- [x] Claim each reminder slot through the Web Locks API before sending it, so windows open at the same time cannot both fire it; give the slot back when display fails so a later check can retry.
- [x] On desktop Chromium, confirm a second window of the same app does not repeat the day's reminder (one notification per slot), and that the second window still fires once the day's record is cleared.
- [x] Describe reminders honestly: they depend on an active page and are not guaranteed after closing or suspending the app.
- [ ] Verify reminder permission and notification delivery on supported Android and desktop browsers.
- [ ] Verify dismissing the reminder banner and daily slot reset.

## 4. Real-device PWA verification — release blocker

Perform these checks on a clean browser profile on each target platform.

### Android Chrome
- [ ] Install from the browser's install UI and confirm the app opens in standalone mode.
- [ ] Launch from the home screen after fully closing the browser.
- [ ] Confirm the manifest name, icon, splash/background color, and start URL.
- [ ] Open the root, settings, and a habit detail link directly.

### Samsung Internet
- [ ] Confirm the browser offers an install/add-to-home-screen path.
- [ ] Confirm the installed shortcut opens the standalone experience where supported.
- [ ] Confirm the manifest icons and app name are correct.
- [ ] Confirm direct links and back navigation work.

### Desktop Chrome / Edge
- [ ] Confirm browser installation and standalone launch.
- [ ] Confirm keyboard navigation and visible focus.
- [ ] Confirm resizing does not hide primary actions or dialogs.

### Offline and update checks
- [ ] Open the app online once and wait for service-worker installation to finish.
- [ ] Switch to airplane mode and reload the root page.
- [ ] Open a previously unvisited in-app route while offline and confirm the app shell loads.
- [ ] Confirm habit creation and check-ins still work offline.
- [ ] Reconnect, deploy a new build, and confirm the service worker updates without losing IndexedDB records.
- [ ] Confirm stale assets are cleaned up after the update.

## 5. Accessibility, layout, and visual polish

- [ ] Review narrow Android screens, a small iPhone-sized viewport, tablet, and desktop.
- [ ] Test light, dark, and system themes.
- [ ] Test large text/200% zoom, keyboard access, dialog focus, and screen-reader labels.
- [ ] Check contrast for muted text, disabled states, habit colors, and progress surfaces.
- [ ] Confirm touch targets, safe-area padding, and no horizontal overflow.
- [ ] Align the PWA icon artwork with the current Nawy mark and ensure maskable artwork has safe padding.

## 6. Release decision

The app can be called **Production Ready** only when:

1. CI, production build, and the PWA deployment validation all pass on the same commit.
2. All data-recovery tests above pass on a real browser profile.
3. Android Chrome, Samsung Internet, and desktop installation/update/offline checks pass for the supported target set.
4. No critical accessibility, data-loss, or navigation issue remains.

Until the real-device checks are recorded, treat the site as a beta release even if the GitHub deployment is green.

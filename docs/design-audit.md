# Nawy Habit — Design-system audit

Reference: `inawy/design-system`, revision `60bdbd2495a39fcd1d3fbacd568dd4616bdb6834`.

## Result

Partial compliance, not full compliance. This audit did not change the application's visual identity.

## Confirmed matches

- Arabic RTL document and explicit RTL menus/toasts.
- Central semantic color tokens rather than scattered page color values.
- Calm, focused habit-recording experience, with loading and empty states.
- Accessible labels on many icon-only controls and status announcements.

## Confirmed deviations

| Reference | Application | Evidence |
| --- | --- | --- |
| Recorded brand color: Nawy Blue `#3D7BFF` | Green primary palette | `src/styles.css` |
| Recorded Arabic font: Cairo | IBM Plex Sans Arabic | `src/styles.css`, `src/routes/__root.tsx` |
| Local Material Symbols Outlined SVG icons | Lucide icons and emoji | Content routes, habit rows/forms, reminders |
| Logical alignment and positioning | Some `text-right`, `right-4` and physical positioning | Habit form and shared dialog |
| Clear focus-visible for every interactive element | Shared Button has explicit focus styling; several custom controls do not | Habit check-in, calendar navigation, reminder dismiss, root fallbacks |
| Consistent number style | Eastern-Arabic digits in habit placeholder | `src/features/habits/habit-form-dialog.tsx:71` |
| Reduced-motion support | No application-wide reduced-motion override | `src/styles.css` |

## Proposed foundations, not mandatory brand values

The reference labels neutral palettes, spacing, type scale, radii and motion timings as proposed starter values. The app's warmer surfaces and different radii are differences to review, not automatically brand violations.

## Remaining verification

- Contrast measurements, 200% zoom, keyboard flow, touch targets and safe-area checks have not been comprehensively verified in this audit.
- Arabic is supported; English/LTR is not currently an implemented product mode.
- Google-hosted typography can fall back when unavailable; it is not a bundled offline font.

## Related reminder accuracy findings

The current reminder scheduler is a Today-page timer, not a background alarm. Suspended or closed pages cannot guarantee delivery. Storage failures and simultaneous tabs can undermine the three-notification cap; these need correction and regression tests before describing reminders as production-ready. Permission and real notification delivery remain unverified. No Cloud service was enabled.

## Next decision

Align the recorded brand color, font and icon source together, then address focus, logical layout, number consistency and reduced motion. Preserve habit storage and logs throughout. Implementation needs a separate agreed scope; this request was an audit only.
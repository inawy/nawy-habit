# Nawy Habit — app icon ("Noon Grid", Google soft tints)

A 3×3 grid of touching square cells on a dark tile. The single Nawy Blue cell at the top centre is
today (noon); the other lit cells are soft pastel tints (Material 100: red, yellow, blue, green)
and three faint "ghost" cells (14 % blue) sit beside and below the blue cell.

The layout is horizontally symmetric, so the icon reads the same in RTL and LTR.

## Source of truth

The icon pack in `brand/icons/` (SVG masters, iOS and Android sets, notification badges, and the
pack's own README with the design numbers) is the source of truth. Do not edit the PNG/ICO files by
hand; replace them from an updated pack. The old generator script was retired earlier.

| File                                                           | Use                                                                        |
| -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `public/icon.svg`                                              | Manifest `sizes: any` icon                                                 |
| `public/favicon.svg`                                           | Browser tab (larger mark, no ghost cells, for 16–48 px)                    |
| `public/favicon.ico`, `public/favicon.png`                     | Fallback tab icons (16/32/48 ICO and a 64 px PNG rendered from the SVG)    |
| `public/icon-192.png`, `public/icon-512.png`                   | PWA icons, rounded tile with transparent corners                           |
| `public/icon-maskable-192.png`, `public/icon-maskable-512.png` | PWA maskable icons, full-bleed (the 192 is downscaled from the pack's 512) |
| `public/apple-touch-icon.png`                                  | iOS home screen, full-bleed (iOS applies its own mask)                     |
| `public/badge-96.png`                                          | Monochrome notification badge, used by `showHabitReminder`                 |
| `brand/icons/ios`, `brand/icons/android`                       | Native store/wrapper sets, not used by the PWA build                       |
| `brand/icons/svg`                                              | Masters: app icon, square and small-size optical variants, marks, badge    |

The manifest `theme_color` and `background_color` are the tile colour `#111318`. They must stay
equal (the Pages smoke test checks it) so the splash screen and system bar match the icon.

## Colours

| Part              | Hex                       |
| ----------------- | ------------------------- |
| Today (hero cell) | `#3D7BFF`                 |
| Soft red          | `#FAD2CF`                 |
| Soft yellow       | `#FEEFC3`                 |
| Soft blue         | `#D2E3FC`                 |
| Soft green        | `#CEEAD6`                 |
| Ghost cells       | `#3D7BFF` at 14 % opacity |
| Tile              | `#111318`                 |

## Geometry (tile = 512 units)

Mark width T/φ = 316.4 (cell 105.5), tile radius T/φ³ = 120.9, margins top:bottom 1:φ, sharp cell
corners and no gaps. At 48 px and below a larger mark (0.80 T) without ghost cells is used.
Maskable and round icons use a smaller centred mark to stay inside the safe zone; monochrome and
badge variants are solid white cells.

## Habit colors

Habit colors use the same Google soft-tint palette (Material 100 for tiles, 300 in dark mode, a
darker shade as the light-mode fill). The tokens (`--habit-color`, `--habit-ink`, `--habit-soft`,
`--habit-on`) live in `src/styles.css`. Stored ids (`teal`, `amber`, `slate`, ...) never change;
`teal` shows as sky blue, `amber` as yellow and `slate` as grey. Yellow and orange fills are
lighter than WCAG 3:1 on white, so they use a dark check mark (`--habit-on`) and a darker ink.

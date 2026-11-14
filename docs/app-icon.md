# Nawy Habit — app icon ("Noon Grid")

A 3×3 grid of habit cells. The bottom row is done, the sides are in progress, and the
single round "sun" at the top centre is today (noon). Dark tile, Nawy Blue cells.

The grid is horizontally symmetric, so the icon reads the same in RTL and LTR.

## Source of truth

The icon pack in `brand/icons/` (SVG masters, iOS and Android sets, notification badges) is the
source of truth. The old generator script `scripts/brand/build-icons.py` was retired because it
would overwrite the pack's renders. Do not edit the PNG/ICO files by hand; replace them from an
updated pack.

| File                                                           | Use                                                                        |
| -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `public/icon.svg`                                              | Manifest `sizes: any` icon                                                 |
| `public/favicon.svg`                                           | Browser tab (wider gaps, bigger mark for 16–32 px)                         |
| `public/favicon.ico`, `public/favicon.png`                     | Fallback tab icons (16/32/48 and 64 px)                                    |
| `public/icon-192.png`, `public/icon-512.png`                   | PWA icons, rounded tile with transparent corners                           |
| `public/icon-maskable-192.png`, `public/icon-maskable-512.png` | PWA maskable icons, full-bleed (the 192 is downscaled from the pack's 512) |
| `public/apple-touch-icon.png`                                  | iOS home screen, full-bleed (iOS applies its own mask)                     |
| `public/badge-96.png`                                          | Monochrome notification badge, used by `showHabitReminder`                 |
| `brand/icons/ios`, `brand/icons/android`                       | Native store/wrapper sets, not used by the PWA build                       |

## Geometry (tile = 512 units)

| Part              | Rule                                        | Value               |
| ----------------- | ------------------------------------------- | ------------------- |
| Mark width        | W = T / φ                                   | 316.4               |
| Gap               | cell : gap = φ³                             | cell 91.1, gap 21.5 |
| Cell radius       | c / φ³                                      | 21.5                |
| Tile radius       | T / φ³                                      | 120.9               |
| Corners           | continuous (smoothed) curve, 60 % smoothing |                     |
| Vertical position | optical centring from OKLab weights         | lifted 8 units      |
| Sun               | circle, radius 0.55 × cell                  |                     |

## What changed from the first version

- **Wider gap** (φ³ instead of φ⁴): cells stay separate at 32 px and below.
- **Lighter empty cells** (`#263558` instead of `#12203F`): the empty cells were almost the
  same colour as the tile (about 1.1:1) and disappeared. They are now 1.47:1, which is visible
  but still clearly "not done".
- **Round sun**: the only circle in the grid, so today is recognisable at 16 px.
- **Smoothed corners**: matches iOS/Android icon shapes instead of plain circular arcs.
- **Optical centring**: the old version added an arbitrary top:bottom margin of 1:φ. The mark is
  now centred by visual weight, so it no longer looks pushed down.
- **Maskable icon**: the mark is scaled so all painted pixels fit in the 80 % Android safe circle.
- **Favicon variant**: a separate small-size design with a larger mark and φ² gaps.

## Colours

| Name                | Hex       | Contrast on tile |
| ------------------- | --------- | ---------------- |
| Sun (today)         | `#EAF1FF` | 15.75:1          |
| Base (done)         | `#3D7BFF` | 4.65:1           |
| Sides (in progress) | `#2B5BD0` | 2.98:1           |
| Empty               | `#263558` | 1.47:1           |
| Tile                | `#0F172A` | —                |

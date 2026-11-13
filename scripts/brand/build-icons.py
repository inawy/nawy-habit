#!/usr/bin/env python3
"""Nawy Habit — "Noon Grid" app icon generator.

Single source of truth for the app icon. Every SVG/PNG/ICO in `public/` that
belongs to the icon is produced from the geometry in this file, so changing a
ratio or a colour here and re-running the script keeps all sizes consistent.

    python3 scripts/brand/build-icons.py            # writes into ./public
    python3 scripts/brand/build-icons.py --check    # also verifies safe zones

Requires: Python 3.10+, Pillow, numpy and `rsvg-convert` (librsvg).
The geometry is documented in docs/app-icon.md.
"""

from __future__ import annotations

import argparse
import io
import math
import struct
import subprocess
import sys
from dataclasses import dataclass, replace
from pathlib import Path

import numpy as np
from PIL import Image

PHI = (1 + 5**0.5) / 2
T = 512  # design units: the tile is always 512 x 512

PALETTE = {
    "dot": "#EAF1FF",  # today / noon
    "base": "#3D7BFF",  # Nawy Blue — completed
    "sides": "#2B5BD0",  # in progress
    "empty": "#263558",  # not done yet (kept visible on purpose)
    "tile": "#0F172A",
}

# The sun is a circle with the same area as a (smoothed) cell, so it carries equal visual
# weight while being the only round shape in the grid. Radius as a fraction of the cell.
DOT_R = 0.55

# Rows top -> bottom. The grid is horizontally symmetric, so it is RTL-safe.
LAYOUT = [
    ["empty", "dot", "empty"],
    ["sides", "empty", "sides"],
    ["base", "base", "base"],
]


# --------------------------------------------------------------------------- #
# Colour maths
# --------------------------------------------------------------------------- #
def _rgb(hex_color: str) -> tuple[float, float, float]:
    h = hex_color.lstrip("#")
    return tuple(int(h[i : i + 2], 16) / 255 for i in (0, 2, 4))  # type: ignore[return-value]


def _lin(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def luminance(hex_color: str) -> float:
    r, g, b = (_lin(c) for c in _rgb(hex_color))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a: str, b: str) -> float:
    la, lb = sorted((luminance(a), luminance(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def oklab_l(hex_color: str) -> float:
    r, g, b = (_lin(c) for c in _rgb(hex_color))
    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l_, m_, s_ = (math.copysign(abs(v) ** (1 / 3), v) for v in (l, m, s))
    return 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_


# --------------------------------------------------------------------------- #
# Continuous-corner ("squircle") rectangle path
# --------------------------------------------------------------------------- #
def _rot(v: tuple[float, float], k: int) -> tuple[float, float]:
    x, y = v
    for _ in range(k % 4):
        x, y = -y, x
    return x, y


def squircle(x: float, y: float, w: float, h: float, r: float, smooth: float = 0.6) -> str:
    """Rounded rectangle whose corners blend into the edges with G2 continuity."""
    half = min(w, h) / 2
    r = min(r, half)
    smooth = min(smooth, half / r - 1)
    p = (1 + smooth) * r
    arc_measure = 90 * (1 - smooth)
    arc_len = math.sin(math.radians(arc_measure / 2)) * r * math.sqrt(2)
    alpha = (90 - arc_measure) / 2
    p3p4 = r * math.tan(math.radians(alpha / 2))
    beta = 45 * smooth
    c = p3p4 * math.cos(math.radians(beta))
    d = c * math.tan(math.radians(beta))
    b = (p - arc_len - c - d) / 3
    a = 2 * b

    def f(v: float) -> str:
        return f"{v:.2f}".rstrip("0").rstrip(".")

    def pt(v: tuple[float, float]) -> str:
        return f"{f(v[0])} {f(v[1])}"

    def corner(k: int) -> str:
        c1 = [_rot(v, k) for v in ((a, 0), (a + b, 0), (a + b + c, d))]
        arc = _rot((arc_len, arc_len), k)
        c2 = [_rot(v, k) for v in ((d, c), (d, b + c), (d, a + b + c))]
        return (
            f"c{pt(c1[0])} {pt(c1[1])} {pt(c1[2])}"
            f"a{f(r)} {f(r)} 0 0 1 {pt(arc)}"
            f"c{pt(c2[0])} {pt(c2[1])} {pt(c2[2])}"
        )

    return (
        f"M{f(x + p)} {f(y)}L{f(x + w - p)} {f(y)}{corner(0)}"
        f"L{f(x + w)} {f(y + h - p)}{corner(1)}"
        f"L{f(x + p)} {f(y + h)}{corner(2)}"
        f"L{f(x)} {f(y + p)}{corner(3)}Z"
    )


# --------------------------------------------------------------------------- #
# Geometry
# --------------------------------------------------------------------------- #
@dataclass(frozen=True)
class Spec:
    w_ratio: float = 1 / PHI  # mark width / tile
    gap_pow: float = 3  # cell : gap = PHI ** gap_pow
    cell_r_pow: float = 3  # cell radius = cell / PHI ** cell_r_pow
    tile_r_pow: float = 3  # tile radius = T / PHI ** tile_r_pow
    smooth: float = 0.6  # corner smoothing (0 = plain arc)
    lift: float | None = None  # None -> optical centring (see optical_lift)
    bleed: bool = False  # True -> full-bleed square (apple / maskable)
    glow: bool = False  # soft "noon" halo behind the dot
    gradient: bool = False  # faint vertical depth on the tile
    circle_dot: bool = False  # draw the dot as a circle instead of a cell


def cell_size(spec: Spec) -> tuple[float, float]:
    w = T * spec.w_ratio
    c = w / (3 + 2 / PHI**spec.gap_pow)
    return c, c / PHI**spec.gap_pow


def optical_lift(spec: Spec) -> float:
    """How far to raise the mark so its perceptual centre of mass sits on the tile centre.

    Each cell is weighted by its OKLab lightness difference from the tile, i.e. how
    strongly it stands out. The bright dot on the top row and the bright base row
    nearly cancel, leaving a small downward bias that we remove.
    """
    c, g = cell_size(spec)
    tile_l = oklab_l(PALETTE["tile"])
    num = den = 0.0
    for i, row in enumerate(LAYOUT):
        for name in row:
            wgt = max(0.0, oklab_l(PALETTE[name]) - tile_l)
            num += wgt * (i - 1)
            den += wgt
    return round(num / den * (c + g))


def cells(spec: Spec) -> list[tuple[str, float, float, float]]:
    c, g = cell_size(spec)
    w = T * spec.w_ratio
    lift = optical_lift(spec) if spec.lift is None else spec.lift
    x0 = (T - w) / 2
    y0 = (T - w) / 2 - lift
    out = []
    for i, row in enumerate(LAYOUT):
        for j, name in enumerate(row):
            out.append((name, x0 + j * (c + g), y0 + i * (c + g), c))
    return out


def build_svg(spec: Spec, *, mark_only: bool = False, size: int | None = None) -> str:
    c, _ = cell_size(spec)
    r = c / PHI**spec.cell_r_pow
    tile_r = T / PHI**spec.tile_r_pow
    dims = f' width="{size}" height="{size}"' if size else ""
    p = PALETTE
    defs, body = [], []

    if spec.gradient:
        defs.append(
            '<linearGradient id="tile" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#16213D"/><stop offset="1" stop-color="#0B1222"/>'
            "</linearGradient>"
        )
        tile_fill = "url(#tile)"
    else:
        tile_fill = p["tile"]

    if not mark_only:
        if spec.bleed:
            body.append(f'<rect width="{T}" height="{T}" fill="{tile_fill}"/>')
        else:
            body.append(f'<path d="{squircle(0, 0, T, T, tile_r, spec.smooth)}" fill="{tile_fill}"/>')

    placed = cells(spec)
    if spec.glow and not mark_only:
        dot = next(cell for cell in placed if cell[0] == "dot")
        cx, cy = dot[1] + dot[3] / 2, dot[2] + dot[3] / 2
        defs.append(
            f'<radialGradient id="glow" cx="{cx:.1f}" cy="{cy:.1f}" r="{c * 2.1:.1f}" gradientUnits="userSpaceOnUse">'
            f'<stop offset="0" stop-color="{p["base"]}" stop-opacity=".42"/>'
            f'<stop offset="1" stop-color="{p["base"]}" stop-opacity="0"/></radialGradient>'
        )
        body.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{c * 2.1:.1f}" fill="url(#glow)"/>')

    for name, x, y, s in placed:
        if name == "dot" and spec.circle_dot:
            body.append(
                f'<circle cx="{x + s / 2:.2f}" cy="{y + s / 2:.2f}" r="{s * DOT_R:.2f}" fill="{p[name]}"/>'
            )
        else:
            body.append(f'<path d="{squircle(x, y, s, s, r, spec.smooth)}" fill="{p[name]}"/>')

    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {T} {T}"{dims}>'
        "<title>Nawy Habit</title>"
        + (f"<defs>{''.join(defs)}</defs>" if defs else "")
        + "".join(body)
        + "</svg>"
    )


# --------------------------------------------------------------------------- #
# Rasterising helpers
# --------------------------------------------------------------------------- #
def rasterise(svg: str, px: int) -> Image.Image:
    out = subprocess.run(
        ["rsvg-convert", "-w", str(px), "-h", str(px), "-f", "png"],
        input=svg.encode(),
        capture_output=True,
        check=True,
    ).stdout
    return Image.open(io.BytesIO(out)).convert("RGBA")


def max_radius(spec: Spec) -> float:
    """Farthest painted point of the mark from the tile centre, in design units."""
    px = 1024
    alpha = np.asarray(rasterise(build_svg(spec, mark_only=True), px))[..., 3]
    ys, xs = np.nonzero(alpha > 8)
    k = T / px
    return float(np.hypot((xs + 0.5) * k - T / 2, (ys + 0.5) * k - T / 2).max())


def fit_safe_zone(base: Spec, radius: float) -> Spec:
    """Largest mark width whose painted pixels stay inside a circle of `radius` units."""
    lo, hi = 0.30, 0.70
    for _ in range(14):
        mid = (lo + hi) / 2
        # keep the lift proportional to the mark so the composition does not change
        probe = replace(base, w_ratio=mid, lift=None)
        if max_radius(probe) <= radius:
            lo = mid
        else:
            hi = mid
    return replace(base, w_ratio=round(lo, 3), lift=None)


def write_ico(path: Path, images: list[Image.Image]) -> None:
    blobs = []
    for im in images:
        buf = io.BytesIO()
        im.save(buf, format="PNG")
        blobs.append((im.width, im.height, buf.getvalue()))
    header = struct.pack("<HHH", 0, 1, len(blobs))
    offset = 6 + 16 * len(blobs)
    entries, data = b"", b""
    for w, h, blob in blobs:
        entries += struct.pack("<BBBBHHII", w % 256, h % 256, 0, 0, 1, 32, len(blob), offset + len(data))
        data += blob
    path.write_bytes(header + entries + data)


# --------------------------------------------------------------------------- #
# Variants that ship
# --------------------------------------------------------------------------- #
ANY = Spec(circle_dot=True)  # rounded tile, transparent corners
SMALL = Spec(w_ratio=0.74, gap_pow=2, circle_dot=True)  # favicons: bigger mark, wider gaps
BLEED = Spec(bleed=True, circle_dot=True)  # apple-touch + maskable base


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default="public", help="output directory (default: public)")
    ap.add_argument("--check", action="store_true", help="print the measurements used in docs/app-icon.md")
    args = ap.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    maskable = fit_safe_zone(BLEED, 0.4 * T)  # Android safe zone: circle of 80 % diameter
    apple = replace(BLEED, w_ratio=round(1 / PHI, 3))  # iOS applies its own mask, keep the full mark

    files: dict[str, str] = {
        "icon.svg": build_svg(ANY),
        "favicon.svg": build_svg(SMALL),
    }
    for name, svg in files.items():
        (out / name).write_text(svg + "\n", encoding="utf-8")

    for px in (192, 512):
        rasterise(build_svg(ANY), px).save(out / f"icon-{px}.png", optimize=True)
        rasterise(build_svg(maskable), px).convert("RGB").save(out / f"icon-maskable-{px}.png", optimize=True)
    rasterise(build_svg(apple), 180).convert("RGB").save(out / "apple-touch-icon.png", optimize=True)
    rasterise(build_svg(SMALL), 64).save(out / "favicon.png", optimize=True)
    write_ico(out / "favicon.ico", [rasterise(build_svg(SMALL), px) for px in (16, 32, 48)])

    if args.check:
        c, g = cell_size(ANY)
        print(f"any      W={T * ANY.w_ratio:.1f}  cell={c:.1f}  gap={g:.1f}  lift={optical_lift(ANY):.0f}  r_max={max_radius(ANY):.1f}")
        print(f"maskable W_ratio={maskable.w_ratio}  r_max={max_radius(maskable):.1f}  (limit {0.4 * T:.1f})")
        print(f"apple    W_ratio={apple.w_ratio}")
        c, g = cell_size(SMALL)
        print(f"small    W={T * SMALL.w_ratio:.1f}  cell={c:.1f}  gap={g:.1f}")
        for name in ("empty", "sides", "base", "dot"):
            print(f"contrast {name:5s} vs tile = {contrast(PALETTE[name], PALETTE['tile']):.2f}:1")
    return 0


if __name__ == "__main__":
    sys.exit(main())

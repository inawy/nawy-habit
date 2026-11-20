#!/usr/bin/env python3
"""Builds tools/android/res (launcher + notification icons) from the Nawy icon pack in brand/icons.

The pack is the source of truth (docs/app-icon.md): replace it, then re-run this script and commit
the result. Needs Pillow only.  Usage: python3 tools/android/make_res.py
"""
import pathlib
import shutil

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
PACK = ROOT / "brand" / "icons"
RES = ROOT / "tools" / "android" / "res"

DENSITIES = ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"]
LAUNCHER_PX = dict(zip(DENSITIES, [48, 72, 96, 144, 192]))
ADAPTIVE_PX = dict(zip(DENSITIES, [108, 162, 216, 324, 432]))  # 108dp layer
STATUS_PX = dict(zip(DENSITIES, [24, 36, 48, 72, 96]))  # 24dp status-bar icon
TILE = "#111318"
STATUS_NAME = "ic_stat_ada"

ADAPTIVE_XML = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
    <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>
</adaptive-icon>
"""

BACKGROUND_XML = f"""<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">{TILE}</color>
</resources>
"""


def resized(src: pathlib.Path, px: int) -> Image.Image:
    return Image.open(src).convert("RGBA").resize((px, px), Image.LANCZOS)


def main() -> None:
    if RES.exists():
        shutil.rmtree(RES)
    android = PACK / "android"
    for d in DENSITIES:
        out = RES / f"mipmap-{d}"
        out.mkdir(parents=True)
        # Legacy launcher icons come ready-made at the right size in the pack.
        for name in ("ic_launcher", "ic_launcher_round"):
            Image.open(android / f"{name}-{d}.png").convert("RGBA").save(out / f"{name}.png")
        # Adaptive layers: the pack ships one 432 px master; scale it for each density.
        resized(android / "adaptive-foreground-432.png", ADAPTIVE_PX[d]).save(
            out / "ic_launcher_foreground.png"
        )
        resized(android / "adaptive-monochrome-432.png", ADAPTIVE_PX[d]).save(
            out / "ic_launcher_monochrome.png"
        )
        # Status-bar icon: white on transparent, from the pack's 96 px badge.
        status = RES / f"drawable-{d}"
        status.mkdir(parents=True)
        resized(PACK / "notification" / "badge-96.png", STATUS_PX[d]).save(
            status / f"{STATUS_NAME}.png"
        )
    any26 = RES / "mipmap-anydpi-v26"
    any26.mkdir(parents=True)
    for name in ("ic_launcher.xml", "ic_launcher_round.xml"):
        (any26 / name).write_text(ADAPTIVE_XML, encoding="utf-8")
    values = RES / "values"
    values.mkdir(parents=True)
    (values / "ic_launcher_background.xml").write_text(BACKGROUND_XML, encoding="utf-8")
    # Play Console wants the 512 px store icon next to the other assets.
    store = ROOT / "tools" / "android" / "playstore-icon-512.png"
    shutil.copyfile(android / "playstore-512.png", store)
    print(f"wrote {sum(1 for _ in RES.rglob('*') if _.is_file())} files under {RES}")


if __name__ == "__main__":
    main()

"""
Cuts the FRISA mascot renders and logo out of their white backgrounds.

The source renders in `public/Images/*.png` are large (1254 px, ~1.4 MB each) and
sit on a flat off-white background. The app renders the versions this script
writes to `public/Images/brand/*.webp`: transparent, cropped to the character,
downscaled and a fraction of the size, with the faint ground shadow kept as a
soft transparent black so the character sits naturally on any surface.

    python scripts/cutout-brand.py

Dev-only; needs Pillow, NumPy and SciPy. Run it again after adding a new pose,
then register the pose in `src/components/common/Mascot.tsx`.
"""

from __future__ import annotations

import os
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parent.parent / "public" / "Images"
OUT = ROOT / "brand"

BACKGROUND = 249.0  # the renders' off-white paper tone


def cutout(src: Path, dst: Path, max_side: int, *, shadow: bool, pad: int = 24) -> None:
    rgb = np.array(Image.open(src).convert("RGB")).astype(int)
    height, width, _ = rgb.shape
    lo, hi = rgb.min(axis=2), rgb.max(axis=2)

    # Background candidates: light and neutral. The character's white body also
    # qualifies, so the flood fill from the borders runs over an eroded mask:
    # thin bridges between background and body are closed, wide regions survive.
    light = (lo >= 244) & ((hi - lo) <= 10)
    core = ndi.binary_erosion(light, iterations=5, border_value=1)
    labels, _ = ndi.label(core)
    touching = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    background = np.isin(labels, touching[touching > 0])
    for _ in range(6):
        background = ndi.binary_dilation(background) & light

    alpha = (~background).astype(np.float32)
    shadowish = np.zeros_like(background)
    if shadow:
        # Everything neutral and light below the last saturated/dark row (the
        # soles of the shoes) is ground shadow: keep it as translucent black.
        solid = (lo < 150) | ((hi - lo) > 40)
        ground = np.where(solid.any(axis=1))[0].max() - 6
        luminance = rgb.mean(axis=2)
        shadowish = (~background) & ((hi - lo) <= 14) & (lo >= 195)
        shadowish[:ground, :] = False
        strength = np.clip((BACKGROUND - luminance) / (BACKGROUND - 195), 0, 1) * 0.55
        alpha = np.where(shadowish, strength, alpha)
        rgb = rgb.copy()
        rgb[shadowish] = 0

    alpha8 = np.array(Image.fromarray((alpha * 255).astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(1.0)))
    coverage = alpha8.astype(np.float32) / 255.0

    # Edge pixels were blended with the paper; un-blend them so no light fringe
    # shows on darker surfaces.
    colour = rgb.astype(np.float32)
    unblended = (colour - BACKGROUND * (1 - coverage[..., None])) / np.maximum(coverage[..., None], 1e-3)
    edge = ((coverage > 0.02) & ~background & ~shadowish)[..., None]
    colour = np.where(edge, np.clip(unblended, 0, 255), colour)

    image = Image.fromarray(np.dstack([colour.astype(np.uint8), alpha8]).astype(np.uint8), "RGBA")
    ys, xs = np.where(alpha8 > 8)
    image = image.crop((max(xs.min() - pad, 0), max(ys.min() - pad, 0), min(xs.max() + pad, width), min(ys.max() + pad, height)))
    scale = max_side / max(image.size)
    if scale < 1:
        image = image.resize((round(image.width * scale), round(image.height * scale)), Image.LANCZOS)

    OUT.mkdir(parents=True, exist_ok=True)
    image.save(dst, "WEBP", quality=90, method=6)
    print(f"{dst.relative_to(ROOT.parent.parent)}  {image.width}x{image.height}  {os.path.getsize(dst) // 1024} KB")


if __name__ == "__main__":
    for pose in ("hi", "happy", "love", "speaker", "think"):
        cutout(ROOT / f"{pose}-mascot.png", OUT / f"{pose}-mascot.webp", 820, shadow=True)
    cutout(ROOT / "logo.png", OUT / "logo.webp", 1000, shadow=False, pad=10)

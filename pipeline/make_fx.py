"""Generate reusable film-grain / dust / scratch overlay frames for the creepy look.

Usage: python pipeline/make_fx.py video/public/fx
Writes grain_00.png ... grain_11.png (960x540 RGBA light/dark specks; plain alpha blending).
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H, N = 960, 540, 12


def main() -> None:
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(1337)
    for i in range(N):
        g = rng.normal(128, 26, (H, W))
        # low-frequency blotches (uneven film density)
        low = rng.normal(0, 10, (H // 30 + 1, W // 30 + 1))
        low = np.array(Image.fromarray(low.astype(np.float32)).resize((W, H), Image.BICUBIC))
        g = np.clip(g + low, 0, 255).astype(np.uint8)
        img = Image.fromarray(g, "L")
        d = ImageDraw.Draw(img)
        # dust specks
        for _ in range(rng.integers(6, 18)):
            x, y = rng.integers(0, W), rng.integers(0, H)
            r = rng.uniform(0.6, 2.6)
            c = int(rng.choice([18, 30, 235]))
            d.ellipse([x - r, y - r, x + r, y + r], fill=c)
        # hairs
        for _ in range(rng.integers(0, 3)):
            x, y = rng.integers(0, W), rng.integers(0, H)
            pts = [(x, y)]
            for _ in range(6):
                x += rng.integers(-9, 10)
                y += rng.integers(-9, 10)
                pts.append((x, y))
            d.line(pts, fill=25, width=1)
        # vertical scratches on some frames
        if rng.random() < 0.5:
            for _ in range(rng.integers(1, 3)):
                x = rng.integers(0, W)
                y0 = rng.integers(0, H // 2)
                y1 = rng.integers(H // 2, H)
                d.line([(x, y0), (x + rng.integers(-3, 4), y1)], fill=int(rng.choice([210, 40])), width=1)
        img = img.filter(ImageFilter.GaussianBlur(0.45))
        # Convert to RGBA specks: brighter-than-mid -> white, darker -> black, alpha = distance from mid.
        a = np.asarray(img).astype(np.int16) - 128
        alpha = np.clip(np.abs(a) * 1.7, 0, 255).astype(np.uint8)
        rgb = np.where(a[..., None] > 0, 255, 0).astype(np.uint8).repeat(3, axis=2)
        Image.fromarray(np.dstack([rgb, alpha]), "RGBA").save(out / f"grain_{i:02d}.png", optimize=True)
    print("wrote", N, "frames to", out)


if __name__ == "__main__":
    main()

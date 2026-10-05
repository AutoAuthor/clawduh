"""Tile review stills into 3x3 contact sheets: python scripts/contact_sheet.py out/stills out/sheets"""
import sys
from pathlib import Path
from PIL import Image

src, dst = Path(sys.argv[1]), Path(sys.argv[2])
dst.mkdir(parents=True, exist_ok=True)
files = sorted(src.glob("f*.jpg"))
per, cw, ch = 9, 640, 360
for s in range(0, len(files), per):
    sheet = Image.new("RGB", (cw * 3, ch * 3), "black")
    for i, f in enumerate(files[s : s + per]):
        im = Image.open(f).resize((cw, ch))
        sheet.paste(im, ((i % 3) * cw, (i // 3) * ch))
    sheet.save(dst / f"sheet_{s // per:02d}.jpg", quality=85)
print("sheets:", len(range(0, len(files), per)))

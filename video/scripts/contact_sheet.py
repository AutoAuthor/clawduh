"""Tile review stills into 3x3 contact sheets: python scripts/contact_sheet.py out/stills out/sheets"""
import sys
from pathlib import Path
from PIL import Image

src, dst = Path(sys.argv[1]), Path(sys.argv[2])
dst.mkdir(parents=True, exist_ok=True)
files = sorted(src.glob("f*.jpg"))
portrait = Image.open(files[0]).height > Image.open(files[0]).width
cols, rows = (6, 2) if portrait else (3, 3)
cw, ch = (320, 568) if portrait else (640, 360)
per = cols * rows
for s in range(0, len(files), per):
    sheet = Image.new("RGB", (cw * cols, ch * rows), "black")
    for i, f in enumerate(files[s : s + per]):
        im = Image.open(f).resize((cw, ch))
        sheet.paste(im, ((i % cols) * cw, (i // cols) * ch))
    sheet.save(dst / f"sheet_{s // per:02d}.jpg", quality=85)
print("sheets:", len(range(0, len(files), per)))

"""Cut a round, grayscale lens out of an indicator-lamp photo so CSS can tint it.

usage: make_led_lens.py SOURCE OUTPUT CENTER_X CENTER_Y RADIUS SIZE [FEATHER [GAMMA]]
The crop is the circle of RADIUS around the center, scaled to SIZE pixels square. Brightness is stretched so the lightest pixel is white,
which lets `background-blend-mode: multiply` onto a color keep that color at the highlights. FEATHER (pixels at the output size, default 3)
softens the circle's edge so the lens sits in its bezel without a hard cut. GAMMA below 1 lifts the midtones, so the ring
lines darken the tinted color less.
"""
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageOps

source_path, output_path = sys.argv[1], sys.argv[2]
center_x, center_y, radius, size = float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5]), int(sys.argv[6])
feather = float(sys.argv[7]) if len(sys.argv) > 7 else 3.0
gamma = float(sys.argv[8]) if len(sys.argv) > 8 else 1.0

source = Image.open(source_path).convert("RGB")
crop_box = (center_x - radius, center_y - radius, center_x + radius, center_y + radius)
lens = source.crop(tuple(round(value) for value in crop_box)).resize((size, size), Image.LANCZOS)
gray = ImageOps.autocontrast(lens.convert("L"), cutoff=1).point(lambda value: round(255 * (value / 255) ** gamma))

mask = Image.new("L", (size, size), 0)
ImageDraw.Draw(mask).ellipse((feather, feather, size - 1 - feather, size - 1 - feather), fill=255)
if feather > 0:
    mask = mask.filter(ImageFilter.GaussianBlur(feather / 2))

output = Image.merge("LA", (gray, mask))
output.save(output_path, optimize=True)
print(output_path)

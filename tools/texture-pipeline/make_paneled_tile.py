"""Cut a seamless tile from a photo of vertical planks.

usage: make_paneled_tile.py SOURCE OUTPUT X0 X1 Y0 SIZE
X0, X1  columns of two plank seams, so the tile holds a whole number of planks and the seam line is split across the wrap
Y0      top of the square crop, which is X1 - X0 tall; pick it clear of any bolt or nail
SIZE    output tile edge in pixels
The grain runs along the planks, so only the top and bottom edges need blending. The tile is crossfaded with a copy rolled by half
its height, which is continuous across the tile's top and bottom edges. make_tile.py also blends sideways, which would ghost the seams.
"""
import sys
from PIL import Image, ImageChops

Image.MAX_IMAGE_PIXELS = None

source_path, output_path = sys.argv[1], sys.argv[2]
x0, x1, y0, size = (int(value) for value in sys.argv[3:7])

edge = x1 - x0
tile = Image.open(source_path).convert("RGB").crop((x0, y0, x1, y0 + edge)).resize((size, size), Image.LANCZOS)

rolled = ImageChops.offset(tile, 0, size // 2)
ramp = Image.new("L", (1, size))
ramp.putdata([round(255 * min(1.0, 2.2 * (1 - abs(2 * y / (size - 1) - 1)))) for y in range(size)])
weight = ramp.resize((size, size))
Image.composite(tile, rolled, weight).save(output_path, quality=82)
print(output_path, (size, size))

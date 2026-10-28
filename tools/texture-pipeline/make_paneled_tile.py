"""Cut a seamless tile of horizontal planks from a photo of vertical ones.

usage: make_paneled_tile.py SOURCE OUTPUT X0 X1 Y0 SIZE OVERLAP
X0, X1   columns of two plank seams, so the tile holds a whole number of planks and the seam line is split across the wrap
Y0       top of the crop, which is X1 - X0 + OVERLAP tall; pick it clear of any bolt or nail
SIZE     output tile edge in pixels
OVERLAP  source rows past the square that the tile's top edge is blended with
The grain runs along the planks, so only the ends of the grain need joining. The first OVERLAP rows of the square are crossfaded into the rows
just below it, so the tile's last row is followed by the row that came next in the photo and the wrap is continuous. The rest of the tile is
untouched photo, which keeps it sharp. make_tile.py also blends sideways, which would ghost the seams.
The photo is soft, so the tile gets a light unsharp mask. The finished tile is turned a quarter turn so the planks run horizontally, like the grain of fam-wood.
"""
import sys
from PIL import Image, ImageFilter

Image.MAX_IMAGE_PIXELS = None

source_path, output_path = sys.argv[1], sys.argv[2]
x0, x1, y0, size, overlap = (int(value) for value in sys.argv[3:8])

edge = x1 - x0
source = Image.open(source_path).convert("RGB").crop((x0, y0, x1, y0 + edge + overlap))
square = source.crop((0, 0, edge, edge))
following = source.crop((0, edge, edge, edge + overlap))

mask = Image.new("L", (1, overlap))
mask.putdata([round(255 * y / (overlap - 1)) for y in range(overlap)])
square.paste(Image.composite(square.crop((0, 0, edge, overlap)), following, mask.resize((edge, overlap))), (0, 0))

tile = square.resize((size, size), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.5, percent=80, threshold=2))
tile.rotate(90).save(output_path, quality=84)
print(output_path, (size, size))

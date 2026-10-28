"""Cut a seamless tile from a photo of ruled or gridded paper.

usage: make_ruled_tile.py SOURCE OUTPUT X0 Y0 WIDTH HEIGHT OVERLAP OUT_WIDTH OUT_HEIGHT
X0, Y0   top left of the tile in the photo
WIDTH    columns in the tile; for a grid, the distance between two grid lines a whole number of cells apart
HEIGHT   rows in the tile; the distance between two rules or grid lines a whole number of rules or cells apart
OVERLAP  source pixels past the tile that its first columns and rows are blended with
Because WIDTH and HEIGHT span a whole number of lines, the pixels just past the tile show the same lines as its first pixels, only displaced by a whole period.
Crossfading the first OVERLAP columns and rows into them therefore joins the paper's shading without doubling any line, which make_tile.py's half-offset blend would do.
"""
import sys
from PIL import Image

Image.MAX_IMAGE_PIXELS = None

source_path, output_path = sys.argv[1], sys.argv[2]
x0, y0, width, height, overlap, out_width, out_height = (int(value) for value in sys.argv[3:10])


def ramp(length, vertical):
    mask = Image.new("L", (1, length) if vertical else (length, 1))
    mask.putdata([round(255 * i / (length - 1)) for i in range(length)])
    return mask


source = Image.open(source_path).convert("RGB").crop((x0, y0, x0 + width + overlap, y0 + height + overlap))

across = source.crop((0, 0, width, height + overlap))
following = source.crop((width, 0, width + overlap, height + overlap))
across.paste(Image.composite(across.crop((0, 0, overlap, height + overlap)), following, ramp(overlap, False).resize((overlap, height + overlap))), (0, 0))

tile = across.crop((0, 0, width, height))
following = across.crop((0, height, width, height + overlap))
tile.paste(Image.composite(tile.crop((0, 0, width, overlap)), following, ramp(overlap, True).resize((width, overlap))), (0, 0))

tile.resize((out_width, out_height), Image.LANCZOS).save(output_path, quality=88)
print(output_path, (out_width, out_height))

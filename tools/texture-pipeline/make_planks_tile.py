"""Build a seamless tile of horizontal planks from a photo of one wide board.

usage: make_planks_tile.py SOURCE OUTPUT SIZE SEED
SIZE  output tile edge in pixels
SEED  picks which strip of the board each plank is cut from; try several and keep the layout with the fewest scratches
The photo is turned a quarter turn so its grain runs horizontally. Each plank is a strip cut from a different place on the board, so no two
planks share grain. The first OVERLAP columns of a strip are crossfaded into the columns just past its end, which are the same grain one tile
further along, so the tile wraps sideways without a seam. Planks are stacked with a shaded groove between them, so it wraps vertically too.
A small median filter takes out the dust and scratches the board's photo carries, and a light unsharp mask restores the grain.
"""
import random
import sys
from PIL import Image, ImageFilter

Image.MAX_IMAGE_PIXELS = None

PLANKS = 6
GAIN = 1.9  # the photo is very dark walnut; this brings it to a mid brown
SCALE = 0.6  # output pixels per source pixel
OVERLAP = 300
QUALITY = 76

source_path, output_path = sys.argv[1], sys.argv[2]
size, seed = int(sys.argv[3]), int(sys.argv[4])

board = Image.open(source_path).convert("RGB").rotate(90, expand=True)
plank_height = size // PLANKS
strip_width, strip_height = round(size / SCALE), round(plank_height / SCALE)
scaled_overlap = round(OVERLAP * SCALE)
random_source = random.Random(seed)


def cut_plank():
    left = random_source.randrange(0, board.width - strip_width - OVERLAP)
    top = random_source.randrange(0, board.height - strip_height)
    strip = board.crop((left, top, left + strip_width + OVERLAP, top + strip_height))
    # Filtering before the blend keeps the image borders, where filters treat pixels differently, away from the join
    scaled = strip.resize((size + scaled_overlap, plank_height), Image.LANCZOS).filter(ImageFilter.MedianFilter(3))
    scaled = scaled.filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
    body = scaled.crop((0, 0, size, plank_height))
    following = scaled.crop((size, 0, size + scaled_overlap, plank_height))
    ramp = Image.new("L", (scaled_overlap, 1))
    ramp.putdata([round(255 * column / (scaled_overlap - 1)) for column in range(scaled_overlap)])
    body.paste(Image.composite(body.crop((0, 0, scaled_overlap, plank_height)), following, ramp.resize((scaled_overlap, plank_height))), (0, 0))
    level = GAIN * random_source.uniform(0.88, 1.12)
    return body.point(lambda value: min(255, round(value * level)))


tile = Image.new("RGB", (size, size))
for index in range(PLANKS):
    tile.paste(cut_plank(), (0, index * plank_height))

groove_height = max(3, round(size / 256))
shading = Image.new("RGBA", (1, size), (0, 0, 0, 0))
shading_pixels = shading.load()


def lay_over(row, color, alpha):
    row %= size
    existing = shading_pixels[0, row]
    combined = alpha + existing[3] / 255 * (1 - alpha)
    channels = tuple(round((color[channel] * alpha + existing[channel] * existing[3] / 255 * (1 - alpha)) / combined) for channel in range(3))
    shading_pixels[0, row] = channels + (round(255 * combined),)


for index in range(PLANKS):
    top = index * plank_height
    for distance in range(-8, 0):
        lay_over(top + distance, (0, 0, 0), 0.22 * (1 - abs(distance) / 9))
    for distance in range(groove_height):
        lay_over(top + distance, (14, 7, 3), 0.8)
    for distance in range(groove_height, groove_height + 2):
        lay_over(top + distance, (255, 226, 186), 0.24 if distance == groove_height else 0.08)

tile = Image.alpha_composite(tile.convert("RGBA"), shading.resize((size, size))).convert("RGB")
tile.save(output_path, quality=QUALITY)
print(output_path, (size, size))

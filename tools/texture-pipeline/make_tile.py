"""Cut a seamless tile from a photo.

usage: make_tile.py SOURCE OUTPUT CROP_FRACTION SIZE FLATTEN_RADIUS [ROTATE_DEGREES]

CROP_FRACTION  fraction of the shorter side to crop, taken from the center
SIZE           output tile edge in pixels
FLATTEN_RADIUS blur radius (at output scale) removed to flatten uneven lighting; 0 disables
"""
import sys
from PIL import Image, ImageChops, ImageFilter, ImageStat

source_path, output_path = sys.argv[1], sys.argv[2]
crop_fraction, size, flatten_radius = float(sys.argv[3]), int(sys.argv[4]), float(sys.argv[5])
rotate_degrees = float(sys.argv[6]) if len(sys.argv) > 6 else 0

image = Image.open(source_path).convert("RGB")
if rotate_degrees:
    image = image.rotate(rotate_degrees, expand=True)

edge = int(min(image.size) * crop_fraction)
left, top = (image.width - edge) // 2, (image.height - edge) // 2
tile = image.crop((left, top, left + edge, top + edge)).resize((size, size), Image.LANCZOS)

if flatten_radius:
    means = ImageStat.Stat(tile).mean
    low_pass = tile.filter(ImageFilter.GaussianBlur(flatten_radius))
    high_pass = ImageChops.subtract(tile, low_pass, scale=1, offset=128)
    channels = [
        channel.point(lambda value, shift=means[index] - 128: max(0, min(255, round(value + shift))))
        for index, channel in enumerate(high_pass.split())
    ]
    tile = Image.merge("RGB", channels)

# Seamless: blend the tile with a copy rolled by half its size. The rolled copy is continuous across
# the tile's edges and the original is continuous across the rolled copy's seam in the middle.
rolled = ImageChops.offset(tile, size // 2, size // 2)
ramp = Image.new("L", (size, 1))
ramp.putdata([round(255 * (1 - abs(2 * x / (size - 1) - 1))) for x in range(size)])
horizontal = ramp.resize((size, size))
vertical = ramp.rotate(90, expand=True).resize((size, size))
weight = ImageChops.multiply(horizontal, vertical)
weight = weight.point(lambda value: round(255 * min(1.0, (value / 255) * 2.2)))
seamless = Image.composite(tile, rolled, weight)

seamless.save(output_path, quality=82)
print(output_path, seamless.size)

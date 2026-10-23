"""Fail when a tiled texture shows a seam where it wraps around.

usage: check_seams.py FILE...
A tile is seamless when the jump from its last column to its first column (and last row to first row) is no bigger than
the biggest jump between neighbouring columns (rows) inside it. WRAP_LIMIT is how many times bigger is still accepted.
Compared with the average jump the test flagged noisy but seamless grain; against the biggest jump, seamless tiles scored 1.07 or less
and plain unblended crops of the same photos scored 1.65 and above.
"""
import sys
from PIL import Image, ImageChops, ImageStat

WRAP_LIMIT = 1.25


def mean_difference(a, b):
    return sum(ImageStat.Stat(ImageChops.difference(a, b)).mean) / len(a.getbands())


def pixel_values(image):
    return list(image.get_flattened_data() if hasattr(image, "get_flattened_data") else image.getdata())


def neighbour_jumps(image, horizontal):
    """Mean difference between each pair of neighbouring columns (rows), averaged over the bands, in float so no precision is lost."""
    width, height = image.size
    if horizontal:
        difference = ImageChops.difference(image.crop((0, 0, width - 1, height)), image.crop((1, 0, width, height)))
        size = (width - 1, 1)
    else:
        difference = ImageChops.difference(image.crop((0, 0, width, height - 1)), image.crop((0, 1, width, height)))
        size = (1, height - 1)
    band_means = [pixel_values(band.convert("F").resize(size, Image.BOX)) for band in difference.split()]
    return [sum(means) / len(band_means) for means in zip(*band_means)]


def axis_ratio(image, horizontal):
    width, height = image.size
    interior = max(neighbour_jumps(image, horizontal))
    if horizontal:
        wrap = mean_difference(image.crop((width - 1, 0, width, height)), image.crop((0, 0, 1, height)))
    else:
        wrap = mean_difference(image.crop((0, height - 1, width, height)), image.crop((0, 0, width, 1)))
    return wrap / interior if interior else 0.0


failures = []
for path in sys.argv[1:]:
    image = Image.open(path).convert("RGB")
    across, down = axis_ratio(image, True), axis_ratio(image, False)
    print(f"{path}: wrap/max-interior across {across:.2f}, down {down:.2f}")
    if across > WRAP_LIMIT or down > WRAP_LIMIT:
        failures.append(path)

if failures:
    sys.exit("seam visible in: " + ", ".join(failures))

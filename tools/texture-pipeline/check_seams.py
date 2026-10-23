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


def axis_ratio(image, horizontal):
    width, height = image.size
    if horizontal:
        interior = max(mean_difference(image.crop((x, 0, x + 1, height)), image.crop((x + 1, 0, x + 2, height))) for x in range(width - 1))
        wrap = mean_difference(image.crop((width - 1, 0, width, height)), image.crop((0, 0, 1, height)))
    else:
        interior = max(mean_difference(image.crop((0, y, width, y + 1)), image.crop((0, y + 1, width, y + 2))) for y in range(height - 1))
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

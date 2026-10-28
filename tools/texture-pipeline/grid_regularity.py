"""Print how far the grid lines of a gridded paper tile stray from even spacing, as a fraction of one cell.

usage: grid_regularity.py TILE CELLS
CELLS  squares across and down in the tile
Each line is located in every strip between the lines it crosses (so the perpendicular lines do not get in the way), and its distance from where an
evenly spaced grid would put it is measured, after taking out any shift of the whole grid. The largest distance over all lines and strips is printed.
A photographed sheet of paper that is not flat scores several hundredths of a cell; a straightened grid scores a few thousandths.
"""
import sys
from PIL import Image, ImageChops

tile_path, cells = sys.argv[1], int(sys.argv[2])
gray = Image.open(tile_path).convert("L")
width, height = gray.size
cell_width, cell_height = width / cells, height / cells


def dip_position(profile, expected, half_window):
    """Position of the darkest point of the profile within half_window of expected, refined by the dark weight around it."""
    low = max(1, round(expected - half_window))
    high = min(len(profile) - 2, round(expected + half_window))
    smoothed = {i: (profile[i - 1] + profile[i] + profile[i + 1]) / 3 for i in range(low, high + 1)}
    center = min(smoothed, key=smoothed.get)
    ceiling = max(smoothed.values())
    weights = {i: ceiling - smoothed[i] for i in range(max(low, center - 3), min(high, center + 3) + 1)}
    return sum(i * weight for i, weight in weights.items()) / sum(weights.values())


def worst_deviation(image, count, cell, along_rows):
    """Lines run across the image; find each in strips midway between the perpendicular lines."""
    shifted = ImageChops.offset(image, 0, round(cell / 2)) if along_rows else ImageChops.offset(image, round(cell / 2), 0)
    strip_count = cells
    errors = []
    for strip in range(strip_count):
        centre = (strip + 0.5) * (width / strip_count if along_rows else height / strip_count)
        half = (width if along_rows else height) / strip_count / 4
        box = (round(centre - half), 0, round(centre + half), shifted.height) if along_rows else (0, round(centre - half), shifted.width, round(centre + half))
        crop = shifted.crop(box)
        profile = list((crop.resize((1, crop.height), Image.BOX) if along_rows else crop.resize((crop.width, 1), Image.BOX)).tobytes())
        for line in range(count):
            errors.append((dip_position(profile, (line + 0.5) * cell, cell / 3) - (line + 0.5) * cell) / cell)
    shift = sum(errors) / len(errors)
    return max(abs(error - shift) for error in errors)


print(max(worst_deviation(gray, cells, cell_height, True), worst_deviation(gray, cells, cell_width, False)))

"""Cut a seamless tile of gridded paper from a photo, straightening the grid.

usage: make_grid_tile.py SOURCE OUTPUT X0 Y0 CELL_X CELL_Y CELLS EXTRA CELL_OUT
X0, Y0    where one grid line crossing is in the photo
CELL_X/Y  roughly how far apart the lines are in the photo, across and down (they differ a little because the sheet is not flat)
CELLS     squares across and down in the tile
EXTRA     further squares cut past the tile to blend its edges with
CELL_OUT  output pixels per square
A photographed sheet is crumpled, so cut straight from it the lines wander. Each line is located along its length in the strips between the
perpendicular lines, the crossings are worked out from those, and every square of the sheet is warped onto an even square. The paper's
shading, creases and grain are kept. Because the grid is then exactly periodic, the first EXTRA squares of the tile can be crossfaded into the
squares just past its far edge without doubling any line, so the tile wraps on both axes.
"""
import sys
from PIL import Image

Image.MAX_IMAGE_PIXELS = None

source_path, output_path = sys.argv[1], sys.argv[2]
x0, y0 = int(sys.argv[3]), int(sys.argv[4])
cell_x, cell_y = float(sys.argv[5]), float(sys.argv[6])
cells, extra, cell_out = int(sys.argv[7]), int(sys.argv[8]), int(sys.argv[9])
lattice = cells + extra  # squares across and down in the straightened sheet; it has lattice + 1 lines each way

STRIP_SHARE = 0.3  # a strip is this share of a cell wide
SEARCH_SHARE = 0.3  # a line is looked for this share of a cell either side of where the line before it says it should be

source = Image.open(source_path).convert("L")


def dark_dip(profile, expected, half_window):
    """Centre of the darkest dip within half_window of expected, once slow shading is taken out; sub-pixel from the dip's depth."""
    average_half = int(max(cell_x, cell_y) * 0.35)
    low, high = max(0, round(expected - half_window)), min(len(profile) - 1, round(expected + half_window))
    depths = {}
    for index in range(low, high + 1):
        around = profile[max(0, index - average_half):index + average_half + 1]
        depths[index] = sum(around) / len(around) - profile[index]
    centre = max(depths, key=depths.get)
    weights = {index: depths[index] for index in range(max(low, centre - 6), min(high, centre + 6) + 1) if depths[index] > 0}
    return sum(index * weight for index, weight in weights.items()) / sum(weights.values())


def line_positions(along_x, line_count, segment_count, cell_along, cell_across, start_across, start_along):
    """position[line][segment]: where each line crosses the middle of each segment, following each line from the one before it."""
    positions = [[] for _ in range(line_count)]
    for segment in range(-1, segment_count + 1):  # one strip beyond each end, so every line has a strip on both sides
        centre = start_along + (segment + 0.5) * cell_along
        half = cell_along * STRIP_SHARE / 2
        expected = start_across
        for line in range(line_count):
            if line > 0:
                expected = positions[line - 1][-1] + cell_across
            span = int(cell_across * (1 + SEARCH_SHARE)) + 1
            box = (round(centre - half), round(expected - span), round(centre + half), round(expected + span)) if along_x else (round(expected - span), round(centre - half), round(expected + span), round(centre + half))
            crop = source.crop(box)
            profile = list((crop.resize((1, crop.height), Image.BOX) if along_x else crop.resize((crop.width, 1), Image.BOX)).tobytes())
            found = dark_dip(profile, span, cell_across * SEARCH_SHARE)
            positions[line].append((box[1] if along_x else box[0]) + found)
            expected = positions[line][-1]
    return positions


rows = line_positions(True, lattice + 1, lattice, cell_x, cell_y, y0, x0)  # horizontal lines, found in strips between the vertical ones
columns = line_positions(False, lattice + 1, lattice, cell_y, cell_x, x0, y0)  # vertical lines, found in strips between the horizontal ones

# Strip -1 is first in each list, so a line's crossing with vertical line i sits between its strips i - 1 and i
crossings = [[None] * (lattice + 1) for _ in range(lattice + 1)]  # crossings[row][column] = (x, y)
for row in range(lattice + 1):
    for column in range(lattice + 1):
        y = (rows[row][column] + rows[row][column + 1]) / 2
        x = (columns[column][row] + columns[column][row + 1]) / 2
        crossings[row][column] = (x, y)

margin = 8
all_x = [point[0] for line in crossings for point in line]
all_y = [point[1] for line in crossings for point in line]
left, top = int(min(all_x)) - margin, int(min(all_y)) - margin
region = Image.open(source_path).convert("RGB").crop((left, top, int(max(all_x)) + margin + 1, int(max(all_y)) + margin + 1))

mesh = []
for row in range(lattice):
    for column in range(lattice):
        north_west, north_east = crossings[row][column], crossings[row][column + 1]
        south_west, south_east = crossings[row + 1][column], crossings[row + 1][column + 1]
        quad = tuple(value for point in (north_west, south_west, south_east, north_east) for value in (point[0] - left, point[1] - top))
        mesh.append(((column * cell_out, row * cell_out, (column + 1) * cell_out, (row + 1) * cell_out), quad))
straightened = region.transform((lattice * cell_out, lattice * cell_out), Image.MESH, mesh, Image.BICUBIC)


def ramp(length, vertical):
    mask = Image.new("L", (1, length) if vertical else (length, 1))
    mask.putdata([round(255 * i / (length - 1)) for i in range(length)])
    return mask


size, overlap = cells * cell_out, extra * cell_out
across = straightened.crop((0, 0, size, size + overlap))
following = straightened.crop((size, 0, size + overlap, size + overlap))
across.paste(Image.composite(across.crop((0, 0, overlap, size + overlap)), following, ramp(overlap, False).resize((overlap, size + overlap))), (0, 0))
tile = across.crop((0, 0, size, size))
following = across.crop((0, size, size, size + overlap))
tile.paste(Image.composite(tile.crop((0, 0, size, overlap)), following, ramp(overlap, True).resize((size, overlap))), (0, 0))
tile.save(output_path, quality=88)
print(output_path, tile.size)

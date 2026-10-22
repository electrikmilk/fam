"""Generate a 9-slice SVG mask of real-looking running stitches.

Each stitch is a short rounded thread segment tilted slightly against the direction of travel. Corner stitches follow the corner
arc, and the stitch period is chosen so spacing stays even across the corner joints (corner arc length = 2 periods).
usage: make_stitch_svg.py SLICE INSET STITCH_LENGTH STITCH_WIDTH TILT_DEGREES
"""
import math
import sys
from urllib.parse import quote

slice_size, inset, stitch_length, stitch_width, tilt_degrees = int(sys.argv[1]), float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5])

radius = slice_size - inset
arc_length = math.pi / 2 * radius
period = arc_length / 2
size = 2 * slice_size + 4 * period
tilt = math.radians(tilt_degrees)

lines = []


def stitch(center_x, center_y, travel_angle):
    angle = travel_angle + tilt
    dx, dy = math.cos(angle) * stitch_length / 2, math.sin(angle) * stitch_length / 2
    lines.append(f"<line x1='{center_x - dx:.2f}' y1='{center_y - dy:.2f}' x2='{center_x + dx:.2f}' y2='{center_y + dy:.2f}'/>")


corners = [
    (slice_size, slice_size, math.pi),
    (size - slice_size, slice_size, 1.5 * math.pi),
    (size - slice_size, size - slice_size, 0.0),
    (slice_size, size - slice_size, 0.5 * math.pi),
]
for center_x, center_y, start_angle in corners:
    for offset in (period / 2, period / 2 + period):
        theta = start_angle + offset / radius
        stitch(center_x + radius * math.cos(theta), center_y + radius * math.sin(theta), theta + math.pi / 2)

for index in range(4):
    along = slice_size + period / 2 + index * period
    stitch(along, inset, 0.0)
    stitch(size - inset, along, math.pi / 2)
    stitch(size - along, size - inset, math.pi)
    stitch(inset, size - along, 1.5 * math.pi)

svg = (
    f"<svg xmlns='http://www.w3.org/2000/svg' width='{size:.2f}' height='{size:.2f}'>"
    f"<g stroke='black' stroke-width='{stitch_width}' stroke-linecap='round'>{''.join(lines)}</g></svg>"
)
print(f"size {size:.2f} period {period:.2f} slice {slice_size}", file=sys.stderr)
print("data:image/svg+xml," + quote(svg, safe="/:=' "))

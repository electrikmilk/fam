"""Print how much a round face's brightness varies with the angle around its centre.

usage: angular_contrast.py FILE [CENTER_X CENTER_Y RADIUS]
Mean luminance is taken in 12 sectors over the ring area (30% to 90% of the radius); the result is brightest sector / darkest sector.
A rotationally symmetric face scores about 1.0. A spiral-metal photo, with its bright and dark wedges, scores well above that.
Without a centre and radius the image's own centre and half-width are used.
"""
import math
import sys
from PIL import Image

path = sys.argv[1]
image = Image.open(path).convert("L")
if len(sys.argv) >= 5:
    center_x, center_y, radius = float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4])
else:
    center_x, center_y, radius = (image.width - 1) / 2, (image.height - 1) / 2, (image.width - 1) / 2

SECTORS = 12
totals, counts = [0.0] * SECTORS, [0] * SECTORS
pixels = image.load()
for step in range(720):
    angle = 2 * math.pi * step / 720
    for fraction in [0.3 + 0.6 * i / 40 for i in range(41)]:
        x = round(center_x + fraction * radius * math.cos(angle))
        y = round(center_y + fraction * radius * math.sin(angle))
        sector = int(step / 720 * SECTORS)
        totals[sector] += pixels[x, y]
        counts[sector] += 1
means = [total / count for total, count in zip(totals, counts)]
print(f"{max(means) / min(means):.2f}")

"""Build a rotationally symmetric knob face from a spiral-metal photo.

usage: make_radial_face.py SOURCE OUTPUT CENTER_X CENTER_Y SOURCE_RADIUS SIZE
The radial profile is averaged over angles that avoid the photo's axis seams and wedge lighting.
"""
import math
import sys
from PIL import Image, ImageFilter

source_path, output_path = sys.argv[1], sys.argv[2]
center_x, center_y, source_radius, size = float(sys.argv[3]), float(sys.argv[4]), int(sys.argv[5]), int(sys.argv[6])

source = Image.open(source_path).convert("RGB").filter(ImageFilter.GaussianBlur(1.5))
pixels = source.load()

seam_margin_degrees = 14
sample_angles = [
    math.radians(quadrant * 90 + offset)
    for quadrant in range(4)
    for offset in range(seam_margin_degrees, 90 - seam_margin_degrees + 1, 3)
]

profile = []
for radius in range(source_radius):
    totals = [0.0, 0.0, 0.0]
    for angle in sample_angles:
        x = round(center_x + radius * math.cos(angle))
        y = round(center_y + radius * math.sin(angle))
        r, g, b = pixels[x, y]
        totals[0] += r
        totals[1] += g
        totals[2] += b
    profile.append(tuple(total / len(sample_angles) for total in totals))

face = Image.new("RGB", (size, size))
face_pixels = face.load()
half = (size - 1) / 2
for y in range(size):
    for x in range(size):
        distance = math.hypot(x - half, y - half) * (source_radius - 1) / half
        distance = min(distance, source_radius - 1.001)
        lower = int(distance)
        fraction = distance - lower
        face_pixels[x, y] = tuple(
            round(profile[lower][channel] * (1 - fraction) + profile[lower + 1][channel] * fraction)
            for channel in range(3)
        )

face.save(output_path, quality=90)
print(output_path)

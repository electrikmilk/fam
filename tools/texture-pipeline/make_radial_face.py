"""Build a knob face from a spiral-metal photo: concentric rings plus the photo's own light and dark wedges.

usage: make_radial_face.py SOURCE OUTPUT CENTER_X CENTER_Y SOURCE_RADIUS SIZE [LIGHT_STRENGTH [TINT_STRENGTH]]
The ring profile is averaged over angles that avoid the photo's axis seams and wedge lighting, which gives clean rings without spokes.
The wedges (the reflections) are then measured separately, as brightness and color versus angle around the center, and multiplied back in:
LIGHT_STRENGTH 0 keeps the rings only, 1 uses the photo's full contrast; TINT_STRENGTH carries over the colour cast of the bright wedges.
"""
import math
import sys
from PIL import Image, ImageFilter

source_path, output_path = sys.argv[1], sys.argv[2]
center_x, center_y, source_radius, size = float(sys.argv[3]), float(sys.argv[4]), int(sys.argv[5]), int(sys.argv[6])
light_strength = float(sys.argv[7]) if len(sys.argv) > 7 else 0.0
tint_strength = float(sys.argv[8]) if len(sys.argv) > 8 else 0.0

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

ANGLE_STEPS = 720
SMOOTHING_STEPS = 6  # moving average half-width, 3 degrees: keeps the wedges, drops the moire between rings and pixels


def angular_profile():
    """Mean colour per angle over the ring area, as a factor of the overall mean: [(r, g, b)] with ANGLE_STEPS entries."""
    inner, outer = round(source_radius * 0.3), round(source_radius * 0.95)
    raw = []
    for step in range(ANGLE_STEPS):
        angle = 2 * math.pi * step / ANGLE_STEPS
        totals = [0.0, 0.0, 0.0]
        radii = range(inner, outer, 4)
        for radius in radii:
            pixel = pixels[round(center_x + radius * math.cos(angle)), round(center_y + radius * math.sin(angle))]
            for channel in range(3):
                totals[channel] += pixel[channel]
        raw.append([total / len(radii) for total in totals])
    smooth = []
    for step in range(ANGLE_STEPS):
        window = [raw[(step + offset) % ANGLE_STEPS] for offset in range(-SMOOTHING_STEPS, SMOOTHING_STEPS + 1)]
        smooth.append([sum(sample[channel] for sample in window) / len(window) for channel in range(3)])
    overall = [sum(sample[channel] for sample in smooth) / ANGLE_STEPS for channel in range(3)]
    return [tuple(sample[channel] / overall[channel] for channel in range(3)) for sample in smooth]


def reflection_factors(profile_entry):
    """Brightness and per-channel tint factors for one angle, scaled by the two strengths."""
    brightness = sum(profile_entry) / 3
    light = 1 + light_strength * (brightness - 1)
    return [light * (1 + tint_strength * (profile_entry[channel] / brightness - 1)) for channel in range(3)]


reflections = angular_profile() if light_strength > 0 else None

face = Image.new("RGB", (size, size))
face_pixels = face.load()
half = (size - 1) / 2
for y in range(size):
    for x in range(size):
        distance = math.hypot(x - half, y - half) * (source_radius - 1) / half
        distance = min(distance, source_radius - 1.001)
        lower = int(distance)
        fraction = distance - lower
        ring = [profile[lower][channel] * (1 - fraction) + profile[lower + 1][channel] * fraction for channel in range(3)]
        if reflections:
            step = round((math.atan2(y - half, x - half) % (2 * math.pi)) / (2 * math.pi) * ANGLE_STEPS) % ANGLE_STEPS
            factors = reflection_factors(reflections[step])
            ring = [ring[channel] * factors[channel] for channel in range(3)]
        face_pixels[x, y] = tuple(min(255, max(0, round(value))) for value in ring)

face.save(output_path, quality=90)
print(output_path)

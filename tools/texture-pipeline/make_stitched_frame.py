"""Build a 9-slice leather frame image from a photo of a stitched seam.

The photo's straight seam (pebbled leather, rolled edge, smooth band with a row of thread stitches) becomes the frame's edge strips.
Corners are made by bending the same strip around a quarter circle (polar warp), with the corner radius chosen so the arc is exactly
two stitch periods long, which keeps stitch spacing even through the corners.

usage: make_stitched_frame.py SOURCE OUTPUT_PNG REGION_X0 REGION_X1 PERIOD STITCH_ROW STITCH_DEPTH FRAME_THICKNESS_CSS [DEBUG_PNG]
"""
import cmath
import math
import sys
from PIL import Image, ImageFilter

source_path, output_path = sys.argv[1], sys.argv[2]
region_x0, region_x1 = int(sys.argv[3]), int(sys.argv[4])
native_period = float(sys.argv[5])
stitch_row = int(sys.argv[6])
stitch_depth = float(sys.argv[7])
thickness_css = float(sys.argv[8])
debug_path = sys.argv[9] if len(sys.argv) > 9 else None

STITCHES_PER_TILE = 12
FEATHER = 22  # native px
DEVICE_SCALE = 2

source = Image.open(source_path).convert("RGB")

# 1. Find the stitch phase in the chosen region from the fundamental of the stitch-row profile
gray = source.convert("L").crop((region_x0, stitch_row - 20, region_x1, stitch_row + 20)).filter(ImageFilter.GaussianBlur(3))
pixels = gray.load()
width, height = gray.size
profile = [sum(pixels[x, y] for y in range(height)) / height for x in range(width)]
mean = sum(profile) / width
spectrum = sum((profile[x] - mean) * cmath.exp(-2j * math.pi * x / native_period) for x in range(width))
phase_position = (cmath.phase(spectrum) / (2 * math.pi)) * native_period  # x of the profile maximum within the region
# A profile maximum may be a stitch or a gap: stitches in this photo are darker loops, so a gap sits at a maximum.
gap_x = region_x0 + phase_position % native_period

tile_start = round(gap_x + native_period)  # first gap midpoint inside the region
tile_width = round(STITCHES_PER_TILE * native_period)

strip_top = round(stitch_row - stitch_depth)
strip_height = round(stitch_depth + 4 * native_period / math.pi)  # frame thickness: stitch depth + stitch radius, where the corner arc = 2 periods
scale = thickness_css * DEVICE_SCALE / strip_height

# 2. Periodic strip: cross-fade the start with the continuation of the end so the tile wraps seamlessly
wide = source.crop((tile_start, strip_top, tile_start + tile_width + FEATHER, strip_top + strip_height))
strip = wide.crop((0, 0, tile_width, strip_height)).copy()
start_part = wide.crop((0, 0, FEATHER, strip_height))
continuation = wide.crop((tile_width, 0, tile_width + FEATHER, strip_height))
blend_mask = Image.linear_gradient("L").rotate(90).resize((FEATHER, strip_height))  # 0 at left -> 255 at right? normalized below
blend_mask = Image.new("L", (FEATHER, strip_height))
blend_mask.putdata([round(255 * (column / (FEATHER - 1))) for _ in range(strip_height) for column in range(FEATHER)])
strip.paste(Image.composite(start_part, continuation, blend_mask), (0, 0))

target_width = round(tile_width * scale)
target_height = round(strip_height * scale)
strip = strip.resize((target_width, target_height), Image.LANCZOS)
tile_period = target_width / STITCHES_PER_TILE
stitch_depth_px = stitch_depth * scale
corner_radius = target_height  # corner slice = frame thickness
stitch_radius = corner_radius - stitch_depth_px
arc_length = math.pi / 2 * stitch_radius
print(f"tile {target_width}x{target_height} device px, period {tile_period:.2f}, arc {arc_length:.2f} (= {arc_length / tile_period:.2f} periods), stitch radius {stitch_radius:.2f}")

# 3. Top-left corner by polar warp (corner slice is corner_radius square; outer edge at radius corner_radius)
strip_pixels = strip.load()


def sample(u, v):
    u %= target_width
    v = min(max(v, 0), target_height - 1.001)
    x0, y0 = int(u), int(v)
    x1 = (x0 + 1) % target_width
    fx, fy = u - x0, v - y0
    result = []
    for channel in range(3):
        top = strip_pixels[x0, y0][channel] * (1 - fx) + strip_pixels[x1, y0][channel] * fx
        bottom = strip_pixels[x0, int(v) + 1][channel] * (1 - fx) + strip_pixels[x1, int(v) + 1][channel] * fx
        result.append(round(top * (1 - fy) + bottom * fy))
    return tuple(result)


corner = Image.new("RGBA", (corner_radius, corner_radius), (0, 0, 0, 0))
corner_pixels = corner.load()
for y in range(corner_radius):
    for x in range(corner_radius):
        dx, dy = x + 0.5 - corner_radius, y + 0.5 - corner_radius
        rho = math.hypot(dx, dy)
        if rho > corner_radius:
            continue
        alpha = 255 if rho < corner_radius - 1 else round(255 * (corner_radius - rho))
        angle = math.atan2(-dy, -dx)  # 0 at the left edge, pi/2 at the top edge
        u = -(math.pi / 2 - angle) * stitch_radius
        v = corner_radius - rho
        r, g, b = sample(u, v)
        corner_pixels[x, y] = (r, g, b, alpha)

# 4. Assemble the 9-slice image
size = 2 * corner_radius + target_width
frame = Image.new("RGBA", (size, size), (0, 0, 0, 0))
top_edge = strip.convert("RGBA")
frame.paste(top_edge, (corner_radius, 0))
frame.paste(top_edge.rotate(-90, expand=True), (size - target_height, corner_radius))
frame.paste(top_edge.rotate(180), (corner_radius, size - target_height))
frame.paste(top_edge.rotate(90, expand=True), (0, corner_radius))
frame.alpha_composite(corner, (0, 0))
frame.alpha_composite(corner.rotate(-90), (size - corner_radius, 0))
frame.alpha_composite(corner.rotate(180), (size - corner_radius, size - corner_radius))
frame.alpha_composite(corner.rotate(90), (0, size - corner_radius))
frame.save(output_path)
print("saved", output_path, frame.size, "slice", corner_radius, "css border", corner_radius / DEVICE_SCALE)

if debug_path:
    marker = wide.convert("RGB").copy()
    from PIL import ImageDraw
    draw = ImageDraw.Draw(marker)
    for k in range(STITCHES_PER_TILE + 1):
        x = k * native_period
        draw.line([(x, 0), (x, 30)], fill=(255, 255, 0), width=3)
    marker.save(debug_path)

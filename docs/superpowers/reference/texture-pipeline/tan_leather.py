"""Tint the stitched-leather frame and fill to a lighter tan (like the Find My Friends sign-in leather).

usage: tan_leather.py FRAME_PNG FILL_TILE_JPG OUT_DIR SLICE FEATHER
A gradient map keyed on the photo's own luminance keeps the real stitch and grain contrast, but moves the leather to tan.
The frame's inner edge is feathered and the fill is tone-matched to the band, as in soft_interior.py.
"""
import math
import sys
from PIL import Image, ImageStat

frame_path, fill_path, out_dir = sys.argv[1:4]
slice_size, feather = int(sys.argv[4]), int(sys.argv[5])

# Gradient map stops (luminance 0..1 -> RGB), tuned to the reference leather: body about (210,174,114), thread-lit highlights about (227,202,156)
STOPS = [(0.0, (126, 94, 58)), (0.35, (166, 126, 76)), (0.65, (208, 168, 106)), (1.0, (243, 222, 178))]


def ramp(t):
    t = min(max(t, 0.0), 1.0)
    for (t0, c0), (t1, c1) in zip(STOPS, STOPS[1:]):
        if t <= t1:
            k = (t - t0) / (t1 - t0)
            return tuple(round(c0[i] + (c1[i] - c0[i]) * k) for i in range(3))
    return STOPS[-1][1]


LUT = [ramp(i / 255) for i in range(256)]


def luminance_range(image):
    values = sorted(p[0] for p in image.convert("L").getdata())
    return values[int(len(values) * 0.01)], values[int(len(values) * 0.99)]


def gradient_map(image, lo, hi):
    gray = image.convert("L").point(lambda v: round(255 * min(max((v - lo) / (hi - lo), 0.0), 1.0) ** 0.42))
    out = Image.new("RGB", image.size)
    pixels, source = out.load(), gray.load()
    for y in range(image.height):
        for x in range(image.width):
            pixels[x, y] = LUT[source[x, y]]
    return out


frame = Image.open(frame_path).convert("RGBA")
opaque = Image.new("RGB", frame.size)
opaque.paste(frame.convert("RGB"), mask=frame.getchannel("A").point(lambda v: 255 if v > 200 else 0))
band_pixels = [p for p, a in zip(frame.convert("RGB").getdata(), frame.getchannel("A").getdata()) if a > 200]
lo_values = sorted(round(0.2126 * r + 0.7152 * g + 0.0722 * b) for r, g, b in band_pixels)
lo, hi = lo_values[int(len(lo_values) * 0.01)], lo_values[int(len(lo_values) * 0.99)]
print("luminance range used", lo, hi)

tan_rgb = gradient_map(frame.convert("RGB"), lo, hi)
tan_frame = tan_rgb.convert("RGBA")
tan_frame.putalpha(frame.getchannel("A"))

size = tan_frame.width
pixels = tan_frame.load()
for y in range(size):
    for x in range(size):
        px, py = x + 0.5, y + 0.5
        dx = max(slice_size - px, 0, px - (size - slice_size))
        dy = max(slice_size - py, 0, py - (size - slice_size))
        fade = min(1.0, math.hypot(dx, dy) / feather)
        fade = fade * fade * (3 - 2 * fade)
        r, g, b, a = pixels[x, y]
        pixels[x, y] = (r, g, b, round(a * fade))
tan_frame.save(f"{out_dir}/leather-frame-tan-soft.png")

y_end = slice_size - feather
band_region = tan_frame.crop((slice_size + 10, y_end - 14, size - slice_size - 10, y_end)).convert("RGB")
band_mean = ImageStat.Stat(band_region).mean

fill = Image.open(fill_path).convert("RGB")
fill_map = gradient_map(fill, lo, hi)
means = ImageStat.Stat(fill_map).mean
matched = Image.merge("RGB", [c.point(lambda v, k=band_mean[i] / means[i]: max(0, min(255, round(v * k)))) for i, c in enumerate(fill_map.split())])
matched.save(f"{out_dir}/leather-fill-tan-tile.jpg", quality=90)
print("band inner mean", [round(v) for v in band_mean], "fill mean", [round(v) for v in ImageStat.Stat(matched).mean])

"""Tint the black stitched-leather frame and fill to a dark brown.

usage: brown_leather.py FRAME_BLACK_PNG FILL_BLACK_JPG OUT_DIR SLICE FEATHER
The original frame recipe's arguments were not recorded, so this works from the finished black assets instead of the photo.
A gradient map keyed on the black frame's own luminance keeps its stitch and grain contrast, as tan_leather.py does for tan.
The frame's alpha is already feathered, so it is kept as is; the fill is tone-matched to the band just outside the fade.
"""
import sys
from PIL import Image, ImageStat

frame_path, fill_path, out_dir = sys.argv[1:4]
slice_size, feather = int(sys.argv[4]), int(sys.argv[5])

# Gradient map stops (luminance 0..1 -> RGB): dark brown body, warmer thread-lit highlights
STOPS = [(0.0, (30, 19, 11)), (0.35, (58, 37, 21)), (0.65, (88, 58, 34)), (1.0, (150, 112, 74))]


def ramp(t):
    t = min(max(t, 0.0), 1.0)
    for (t0, c0), (t1, c1) in zip(STOPS, STOPS[1:]):
        if t <= t1:
            k = (t - t0) / (t1 - t0)
            return tuple(round(c0[i] + (c1[i] - c0[i]) * k) for i in range(3))
    return STOPS[-1][1]


LUT = [ramp(i / 255) for i in range(256)]


def gradient_map(image, lo, hi):
    gray = image.convert("L").point(lambda v: round(255 * min(max((v - lo) / (hi - lo), 0.0), 1.0) ** 0.6))
    out = Image.new("RGB", image.size)
    pixels, source = out.load(), gray.load()
    for y in range(image.height):
        for x in range(image.width):
            pixels[x, y] = LUT[source[x, y]]
    return out


frame = Image.open(frame_path).convert("RGBA")
band_pixels = [p for p, a in zip(frame.convert("RGB").getdata(), frame.getchannel("A").getdata()) if a > 200]
lo_values = sorted(round(0.2126 * r + 0.7152 * g + 0.0722 * b) for r, g, b in band_pixels)
lo, hi = lo_values[int(len(lo_values) * 0.01)], lo_values[int(len(lo_values) * 0.99)]
print("luminance range used", lo, hi)

brown_frame = gradient_map(frame.convert("RGB"), lo, hi).convert("RGBA")
brown_frame.putalpha(frame.getchannel("A"))
brown_frame.save(f"{out_dir}/leather-frame-brown-soft.png")

y_end = slice_size - feather
band_region = brown_frame.crop((slice_size + 10, y_end - 14, brown_frame.width - slice_size - 10, y_end)).convert("RGB")
band_mean = ImageStat.Stat(band_region).mean

fill = Image.open(fill_path).convert("RGB")
fill_map = gradient_map(fill, lo, hi)
means = ImageStat.Stat(fill_map).mean
matched = Image.merge("RGB", [c.point(lambda v, k=band_mean[i] / means[i]: max(0, min(255, round(v * k)))) for i, c in enumerate(fill_map.split())])
matched.save(f"{out_dir}/leather-fill-brown-tile.jpg", quality=90)
print("band inner mean", [round(v) for v in band_mean], "fill mean", [round(v) for v in ImageStat.Stat(matched).mean])

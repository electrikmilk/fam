import sys
from PIL import Image

path = sys.argv[1]
x, y, w, h = map(float, sys.argv[2:6])
text_rgb = tuple(int(v) for v in sys.argv[6:9])
dpr = 2
image = Image.open(path).convert("RGB")
region = image.crop(tuple(int(v * dpr) for v in (x, y, x + w, y + h)))
pixels = list(region.get_flattened_data()) if hasattr(region, "get_flattened_data") else list(region.getdata())


def linear(channel):
    c = channel / 255
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def luminance(rgb):
    r, g, b = rgb
    return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)


def ratio(a, b):
    high, low = max(a, b), min(a, b)
    return (high + 0.05) / (low + 0.05)


text_luminance = luminance(text_rgb)
ratios = sorted(ratio(luminance(p), text_luminance) for p in pixels)
print(f"worst {ratios[0]:.2f}  p05 {ratios[int(len(ratios) * 0.05)]:.2f}  median {ratios[len(ratios) // 2]:.2f}  pixels {len(ratios)}")

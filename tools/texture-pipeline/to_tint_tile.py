"""Bake the CSS filter chain grayscale(1) contrast(1.5) brightness(1.5) into a tile.

usage: to_tint_tile.py SRC_TILE OUT
With this baked in, `background-blend-mode: multiply` over a --fam-tint color reproduces the prototype's tinted felt without a pseudo-element.
CSS filters work in sRGB: grayscale uses Rec. 709 weights, contrast is (v - 0.5) * 1.5 + 0.5, brightness multiplies by 1.5, each clamped.
"""
import sys
from PIL import Image

source_path, output_path = sys.argv[1], sys.argv[2]


def clamp(value):
    return min(max(value, 0.0), 1.0)


def baked(value):
    contrasted = clamp((value / 255 - 0.5) * 1.5 + 0.5)
    return round(255 * clamp(contrasted * 1.5))


image = Image.open(source_path).convert("RGB")
gray = image.convert("L", (0.2126, 0.7152, 0.0722, 0))
gray.point(baked).convert("RGB").save(output_path, quality=88)
print(output_path, image.size)

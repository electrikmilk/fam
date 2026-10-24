"""Stretch a grayscale tile's contrast about mid-gray, so a soft-light blend onto a pale color shows it.

usage: stretch_contrast.py SOURCE OUTPUT FACTOR
Every pixel moves away from 128 by FACTOR, which keeps the tile seamless because the same function is applied to each pixel.
"""
import sys
from PIL import Image

source_path, output_path, factor = sys.argv[1], sys.argv[2], float(sys.argv[3])

source = Image.open(source_path).convert("L")
stretched = source.point(lambda value: max(0, min(255, round(128 + (value - 128) * factor))))
stretched.save(output_path, quality=80)
print(output_path)

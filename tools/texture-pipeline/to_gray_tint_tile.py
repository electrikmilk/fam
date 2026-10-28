"""Turn a tile into a grayscale tint tile with a chosen average brightness and contrast.

usage: to_gray_tint_tile.py SRC_TILE OUT MEAN STDDEV [QUALITY]
With a tile like this, `background-blend-mode: multiply` over a tint color keeps the tint close to its own color (a MEAN near 215 darkens it by about 15%)
and the texture shows as STDDEV levels of light and dark. to_tint_tile.py bakes a fixed filter chain made for the felt, which blows a light photo out to white.
"""
import sys
from PIL import Image, ImageStat

source_path, output_path = sys.argv[1], sys.argv[2]
target_mean, target_stddev = float(sys.argv[3]), float(sys.argv[4])
quality = int(sys.argv[5]) if len(sys.argv) > 5 else 85

gray = Image.open(source_path).convert("L")
stats = ImageStat.Stat(gray)
gain = target_stddev / stats.stddev[0]
gray.point(lambda value: round(min(max((value - stats.mean[0]) * gain + target_mean, 0), 255))).convert("RGB").save(output_path, quality=quality)
print(output_path, gray.size)

import sys
from PIL import Image

source_path, output_path = sys.argv[1], sys.argv[2]
tile = Image.open(source_path).convert("RGB")

# The photo has a red margin line near x=23 and a bright left edge; paste clean paper over both.
tile.paste(tile.crop((36, 0, 56, tile.height)), (13, 0))
tile.paste(tile.crop((60, 0, 74, tile.height)), (0, 0))

paper_rgb = (251, 238, 156)
ink_rgb = (200, 34, 38)
photo_paper_level = 0.93
line_threshold = 0.90
line_gain = 7.0

output = Image.new("RGB", tile.size)
source_pixels = tile.load()
output_pixels = output.load()
for y in range(tile.height):
    for x in range(tile.width):
        r, g, b = source_pixels[x, y]
        level = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
        line_strength = min(1.0, max(0.0, (line_threshold - level) * line_gain))
        texture = min(1.03, max(0.88, 1 + (level - photo_paper_level) * 4))
        output_pixels[x, y] = tuple(
            round((paper_rgb[i] * (1 - line_strength) + ink_rgb[i] * line_strength) * texture)
            for i in range(3)
        )

output.save(output_path, quality=88)

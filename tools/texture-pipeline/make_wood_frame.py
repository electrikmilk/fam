"""Cut a 9-slice picture frame from a photo of a frame with a see-through opening.

usage: make_wood_frame.py SOURCE OUTPUT OUTPUT_WIDTH OUTER_CROP

The opening is filled with the frame's average color, because border-image discards the middle slice.
That lets the output be a JPEG instead of an alpha PNG.
OUTER_CROP is how many pixels, at the output size, to trim off the frame's outer edge to make the border thinner.
Prints the border-image-slice values (top right bottom left) for the output size.
"""
import sys
from PIL import Image, ImageStat

source_path, output_path, output_width, outer_crop = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])

image = Image.open(source_path).convert("RGBA")
source_crop = round(outer_crop * image.width / output_width)
image = image.crop((source_crop, source_crop, image.width - source_crop, image.height - source_crop))
output_width -= 2 * outer_crop
alpha = image.getchannel("A")
opening = alpha.point(lambda value: 255 if value == 0 else 0).getbbox()
if opening is None:
    raise SystemExit(f"{source_path} has no transparent opening")
left, top, right, bottom = opening

rgb = image.convert("RGB")
average = tuple(round(channel) for channel in ImageStat.Stat(rgb, mask=alpha).mean)
flat = Image.new("RGB", image.size, average)
flat.paste(rgb, mask=alpha)

scale = output_width / image.width
resized = flat.resize((output_width, round(image.height * scale)), Image.LANCZOS)
resized.save(output_path, quality=82, optimize=True)

slices = (round(top * scale), round((image.width - right) * scale), round((image.height - bottom) * scale), round(left * scale))
print(output_path, resized.size, "slice", *slices)

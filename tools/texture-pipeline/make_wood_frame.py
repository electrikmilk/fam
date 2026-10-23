"""Cut a 9-slice picture frame from a photo of a frame with a see-through opening.

usage: make_wood_frame.py SOURCE OUTPUT OUTPUT_WIDTH

The opening is filled with the frame's average color, because border-image discards the middle slice.
That lets the output be a JPEG instead of an alpha PNG.
Prints the border-image-slice values (top right bottom left) for the output size.
"""
import sys
from PIL import Image, ImageStat

source_path, output_path, output_width = sys.argv[1], sys.argv[2], int(sys.argv[3])

image = Image.open(source_path).convert("RGBA")
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

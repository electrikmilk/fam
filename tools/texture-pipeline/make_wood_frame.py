"""Cut a four-fold symmetric 9-slice picture frame from a photo of a frame with a see-through opening.

usage: make_wood_frame.py SOURCE OUTPUT OUTPUT_WIDTH OUTER_CROP

The opening is filled with the frame's average color, because border-image discards the middle slice.
That lets the output be a JPEG instead of an alpha PNG.
OUTER_CROP is how many pixels, at the output size, to trim off the frame's outer edge to make the border thinner.
The photo was taken at an angle and lit from one side, so its four rails differ in brightness and in how much of the inner wall shows.
The output is built from the top-left corner and the top rail alone: the corner is mirrored across its miter, and the rail is mirrored
about its middle and turned into the other three sides, so every side matches.
Prints the border-image-slice value for the output.
"""
import sys
from PIL import Image, ImageDraw, ImageStat

HALF_RAIL_LENGTH = 150

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
photo = flat.resize((output_width, round(image.height * scale)), Image.LANCZOS)
top_slice, left_slice = round(top * scale), round(left * scale)
slice_size = top_slice

corner = photo.crop((0, 0, left_slice, top_slice)).resize((slice_size, slice_size), Image.LANCZOS)
above_miter = Image.new("L", corner.size, 0)
ImageDraw.Draw(above_miter).polygon([(0, 0), (slice_size, 0), (slice_size, slice_size)], fill=255)
corner = Image.composite(corner, corner.transpose(Image.TRANSPOSE), above_miter)

half_rail = photo.crop((left_slice, 0, left_slice + HALF_RAIL_LENGTH, top_slice))
top_rail = Image.new("RGB", (2 * HALF_RAIL_LENGTH, slice_size))
top_rail.paste(half_rail, (0, 0))
top_rail.paste(half_rail.transpose(Image.FLIP_LEFT_RIGHT), (HALF_RAIL_LENGTH, 0))
left_rail = top_rail.transpose(Image.TRANSPOSE)

size = 2 * slice_size + top_rail.width
frame = Image.new("RGB", (size, size), average)

far = size - slice_size
frame.paste(corner, (0, 0))
frame.paste(corner.transpose(Image.FLIP_LEFT_RIGHT), (far, 0))
frame.paste(corner.transpose(Image.FLIP_TOP_BOTTOM), (0, far))
frame.paste(corner.transpose(Image.ROTATE_180), (far, far))
frame.paste(top_rail, (slice_size, 0))
frame.paste(top_rail.transpose(Image.FLIP_TOP_BOTTOM), (slice_size, far))
frame.paste(left_rail, (0, slice_size))
frame.paste(left_rail.transpose(Image.FLIP_LEFT_RIGHT), (far, slice_size))

frame.save(output_path, quality=82, optimize=True)
print(output_path, frame.size, "slice", slice_size)

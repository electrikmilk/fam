"""Make the frame's inner edge fade out softly and build a matching smooth-leather fill.

usage: soft_interior.py PHOTO FRAME_PNG FRAME_BLACK_PNG OUT_DIR SLICE FEATHER
1. Feather the frame's inner edge: alpha ramps from 1 to 0 over FEATHER device px, measured as the distance to the interior rectangle
   (so the fade is continuous around the inner corners).
2. Cut a seamless smooth-leather tile from the photo at the same grain scale as the frame strip, flatten uneven lighting,
   and match its average color to the band's inner area just outside the fade so the band continues inward without a visible edge.
"""
import math
import sys
from PIL import Image, ImageChops, ImageFilter, ImageStat

photo_path, frame_path, frame_black_path, out_dir = sys.argv[1:5]
slice_size, feather = int(sys.argv[5]), int(sys.argv[6])

# Same device scale the frame strip was built at: 304 native px of seam became `slice_size` device px
device_scale = slice_size / 304.0


def feathered(path):
    frame = Image.open(path).convert("RGBA")
    size = frame.width
    pixels = frame.load()
    for y in range(size):
        for x in range(size):
            px, py = x + 0.5, y + 0.5
            dx = max(slice_size - px, 0, px - (size - slice_size))
            dy = max(slice_size - py, 0, py - (size - slice_size))
            distance = math.hypot(dx, dy)
            fade = min(1.0, distance / feather)
            fade = fade * fade * (3 - 2 * fade)
            r, g, b, a = pixels[x, y]
            pixels[x, y] = (r, g, b, round(a * fade))
    return frame


def band_mean(frame):
    """Average color of the band's inner area, just outside the fade (top edge, middle of the image)."""
    size = frame.width
    y_end = slice_size - feather
    box = (slice_size + 10, y_end - 14, size - slice_size - 10, y_end)
    region = frame.crop(box).convert("RGB")
    return ImageStat.Stat(region).mean


def smooth_tile(width_native, height_native, x0, y0):
    photo = Image.open(photo_path).convert("RGB")
    crop = photo.crop((x0, y0, x0 + width_native, y0 + height_native))
    width, height = round(width_native * device_scale), round(height_native * device_scale)
    tile = crop.resize((width, height), Image.LANCZOS)
    means = ImageStat.Stat(tile).mean
    low = tile.filter(ImageFilter.GaussianBlur(18))
    high = ImageChops.subtract(tile, low, scale=1, offset=128)
    tile = Image.merge("RGB", [c.point(lambda v, m=means[i] - 128: max(0, min(255, round(v + m)))) for i, c in enumerate(high.split())])
    # Seamless by cross-fading with a half-offset copy (the grain is random, so this does not ghost)
    rolled = ImageChops.offset(tile, width // 2, height // 2)
    horizontal = Image.new("L", (width, 1)); horizontal.putdata([round(255 * (1 - abs(2 * x / (width - 1) - 1))) for x in range(width)])
    vertical = Image.new("L", (1, height)); vertical.putdata([round(255 * (1 - abs(2 * y / (height - 1) - 1))) for y in range(height)])
    weight = ImageChops.multiply(horizontal.resize((width, height)), vertical.resize((width, height)))
    weight = weight.point(lambda v: round(255 * min(1.0, v / 255 * 2.2)))
    return Image.composite(tile, rolled, weight)


def match(tile, target_mean):
    means = ImageStat.Stat(tile).mean
    return Image.merge("RGB", [c.point(lambda v, k=target_mean[i] / means[i]: max(0, min(255, round(v * k)))) for i, c in enumerate(tile.split())])


frame = feathered(frame_path)
frame.save(f"{out_dir}/leather-frame-soft.png")
frame_black = feathered(frame_black_path)
frame_black.save(f"{out_dir}/leather-frame-black-soft.png")

tile = smooth_tile(1500, 460, 1200, 2130)
tile_color = match(tile, band_mean(frame))
tile_color.save(f"{out_dir}/leather-fill-tile.jpg", quality=90)
tile_black = match(tile.convert("L").convert("RGB"), band_mean(frame_black))
tile_black.save(f"{out_dir}/leather-fill-black-tile.jpg", quality=90)

print("tile device size", tile.size, "-> css", round(tile.width / 2, 1), "x", round(tile.height / 2, 1))
print("band inner mean (color)", [round(v) for v in band_mean(frame)], "tile mean", [round(v) for v in ImageStat.Stat(tile_color).mean])
print("band inner mean (black)", [round(v) for v in band_mean(frame_black)], "tile mean", [round(v) for v in ImageStat.Stat(tile_black).mean])

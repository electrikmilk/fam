"""Cut the stitched bottom edge of a bar out of a finished leather frame image.

The frame's bottom strip is a seamless 12-stitch tile. Below the stitch row it carries a thick pebbled rolled edge, which is too heavy for a bar,
so the strip is cut off just below the crease that runs under the stitches. The top rows keep the frame's soft fade, so the strip blends into
the tone-matched leather fill behind it.

usage: make_bar_edge.py FRAME_PNG OUT_PNG SLICE ROWS
  SLICE  the frame's corner slice in device px (68 for the leather frames)
  ROWS   how many rows of the bottom strip to keep, counted from its soft top edge (50 ends just below the crease)
"""
import sys
from PIL import Image

frame_path, output_path = sys.argv[1], sys.argv[2]
slice_size, rows = int(sys.argv[3]), int(sys.argv[4])

frame = Image.open(frame_path).convert("RGBA")
size = frame.width
strip_top = size - slice_size
edge = frame.crop((slice_size, strip_top, size - slice_size, strip_top + rows))
edge.save(output_path)
print("saved", output_path, edge.size)

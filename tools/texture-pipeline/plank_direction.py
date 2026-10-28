"""Print how much more the rows of a tile differ from each other than its columns do.

usage: plank_direction.py TILE
Horizontal planks make each row a different brightness while every column looks alike, so the ratio is well above 1.
Vertical planks give a ratio well below 1.
"""
import sys
from PIL import Image


def spread(values):
    mean = sum(values) / len(values)
    return sum((value - mean) ** 2 for value in values) / len(values)


gray = Image.open(sys.argv[1]).convert("L")
row_means = list(gray.resize((1, gray.height), Image.BOX).tobytes())
column_means = list(gray.resize((gray.width, 1), Image.BOX).tobytes())
print(spread(row_means) / spread(column_means))

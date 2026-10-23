import sys
from PIL import Image, ImageFilter

source_path, y0, y1 = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
image = Image.open(source_path).convert("L")
band = image.crop((0, y0, image.width, y1)).filter(ImageFilter.GaussianBlur(3))
pixels = band.load()
width, height = band.size
profile = [sum(pixels[x, y] for y in range(height)) / height for x in range(width)]
mean = sum(profile) / width
profile = [value - mean for value in profile]
slow = []
window = 200
running = sum(profile[:window])
for x in range(width):
    lo, hi = max(0, x - window // 2), min(width, x + window // 2)
    slow.append(sum(profile[lo:hi]) / (hi - lo))
profile = [p - s for p, s in zip(profile, slow)]


def correlation(lag):
    return sum(profile[x] * profile[x + lag] for x in range(width - lag)) / (width - lag)


scores = {lag: correlation(lag) for lag in range(90, 160)}
best = max(scores, key=scores.get)
# Parabolic refinement around the integer peak
a, b, c = scores[best - 1], scores[best], scores[best + 1]
offset = 0.5 * (a - c) / (a - 2 * b + c)
print("best integer lag", best, "refined period", round(best + offset, 2))
print("top lags:", sorted(scores, key=scores.get, reverse=True)[:5])

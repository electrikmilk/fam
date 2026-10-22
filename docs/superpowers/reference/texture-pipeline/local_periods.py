import sys
from PIL import Image, ImageFilter

image = Image.open(sys.argv[1]).convert("L")
y0, y1 = int(sys.argv[2]), int(sys.argv[3])


def period(x0, x1):
    band = image.crop((x0, y0, x1, y1)).filter(ImageFilter.GaussianBlur(3))
    pixels = band.load()
    width, height = band.size
    profile = [sum(pixels[x, y] for y in range(height)) / height for x in range(width)]
    mean = sum(profile) / width
    profile = [value - mean for value in profile]
    window = 200
    slow = [sum(profile[max(0, x - window // 2):min(width, x + window // 2)]) / (min(width, x + window // 2) - max(0, x - window // 2)) for x in range(width)]
    profile = [p - s for p, s in zip(profile, slow)]

    def correlation(lag):
        return sum(profile[x] * profile[x + lag] for x in range(width - lag)) / (width - lag)

    scores = {lag: correlation(lag) for lag in range(90, 160)}
    best = max(scores, key=scores.get)
    a, b, c = scores[best - 1], scores[best], scores[best + 1]
    return best + 0.5 * (a - c) / (a - 2 * b + c)


for x0, x1 in ((0, 1300), (1300, 2600), (2600, 3872), (800, 2400)):
    print(f"x {x0}-{x1}: period {period(x0, x1):.2f}")

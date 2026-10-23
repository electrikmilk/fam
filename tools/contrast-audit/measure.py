import json
import sys
from PIL import Image

items_path, image_path = sys.argv[1], sys.argv[2]
results_path = sys.argv[3] if len(sys.argv) > 3 else None
data = json.load(open(items_path))
image = Image.open(image_path).convert("RGB")
dpr = image.width / 1440 if image.width % 1440 == 0 else 2


def linear(channel):
    c = channel / 255
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def luminance(rgb):
    return 0.2126 * linear(rgb[0]) + 0.7152 * linear(rgb[1]) + 0.0722 * linear(rgb[2])


def ratio(a, b):
    high, low = max(a, b), min(a, b)
    return (high + 0.05) / (low + 0.05)


def required_ratio(item):
    if item["kind"] == "icon":
        return 3.0
    is_large = item["size"] >= 24 or (item["size"] >= 18.66 and item["weight"] >= 700)
    return 3.0 if is_large else 4.5


results = []
for item in data["items"]:
    # A text range's box is the font's ascent plus descent, which reaches 1 to 2px past the glyphs and, depending on the engine, onto a
    # ruled line next to them. Measure the glyph band instead; icons and placeholders keep their full box.
    inset = 1 if item["kind"] == "text" and item["h"] > 8 else 0
    box = tuple(int(round(v * 2)) for v in (item["x"], item["y"] + inset, item["x"] + item["w"], item["y"] + item["h"] - inset))
    region = image.crop(box)
    pixels = list(region.get_flattened_data()) if hasattr(region, "get_flattened_data") else list(region.getdata())
    if not pixels:
        continue
    ratios = []
    for background in pixels[:: max(1, len(pixels) // 4000)]:
        blended = tuple(item["color"][i] * item["alpha"] + background[i] * (1 - item["alpha"]) for i in range(3))
        ratios.append(ratio(luminance(background), luminance(blended)))
    ratios.sort()
    needed = required_ratio(item)
    results.append({**item, "worst": ratios[0], "median": ratios[len(ratios) // 2], "needed": needed, "passes": ratios[0] >= needed})

failures = [r for r in results if not r["passes"]]
print(f"{len(results)} items measured, {len(failures)} below threshold at the worst pixel")
print()
for r in sorted(failures, key=lambda r: r["worst"] - r["needed"]):
    print(f"{r['kind']:11} worst {r['worst']:5.2f} median {r['median']:5.2f} need {r['needed']}  alpha {r['alpha']:.2f} size {r['size']:.0f}  {r['sel']}  in {r['parent']}  \"{r['text']}\"")

if results_path:
    summary = {
        "measured": len(results),
        "failures": [{key: r[key] for key in ("kind", "worst", "needed", "text", "sel")} for r in failures],
    }
    json.dump(summary, open(results_path, "w"))

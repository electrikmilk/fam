import { PNG } from 'pngjs';

export function statistics(pngBuffer) {
  const { data, width, height } = PNG.sync.read(pngBuffer);
  const pixelCount = width * height;
  const mean = [0, 0, 0];
  for (let index = 0; index < data.length; index += 4) {
    for (let channel = 0; channel < 3; channel += 1) mean[channel] += data[index + channel];
  }
  for (let channel = 0; channel < 3; channel += 1) mean[channel] /= pixelCount;

  const variance = [0, 0, 0];
  for (let index = 0; index < data.length; index += 4) {
    for (let channel = 0; channel < 3; channel += 1) variance[channel] += (data[index + channel] - mean[channel]) ** 2;
  }
  return { mean, deviation: variance.map((sum) => Math.sqrt(sum / pixelCount)) };
}

const linear = (channel) => {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};
const luminance = (red, green, blue) => 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
const contrast = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

// Compares two screenshots of the same region. A pixel "changed" when any channel moved by more than `threshold`;
// of the changed pixels, reports how many differ from what was there before by at least `ratio`:1 (WCAG non-text contrast is 3:1).
export function changedPixelContrast(beforeBuffer, afterBuffer, { threshold = 24, ratio = 3 } = {}) {
  const before = PNG.sync.read(beforeBuffer);
  const after = PNG.sync.read(afterBuffer);
  let changed = 0;
  let distinct = 0;
  for (let index = 0; index < before.data.length; index += 4) {
    const moved = [0, 1, 2].some((channel) => Math.abs(before.data[index + channel] - after.data[index + channel]) > threshold);
    if (!moved) continue;
    changed += 1;
    const was = luminance(before.data[index], before.data[index + 1], before.data[index + 2]);
    const now = luminance(after.data[index], after.data[index + 1], after.data[index + 2]);
    if (contrast(was, now) >= ratio) distinct += 1;
  }
  return { changed, fraction: changed ? distinct / changed : 0 };
}

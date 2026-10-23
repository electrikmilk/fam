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

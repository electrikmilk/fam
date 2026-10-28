import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { access, readFile, stat } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ASSET_NAMES = [
  'felt-gray-tile.jpg',
  'wood-light-tile.jpg',
  'wood-paneled-tile.jpg',
  'metal-tile.jpg',
  'metal-sandblasted-tile.jpg',
  'metal-brushed.jpg',
  'metal-spiral.jpg',
  'knob-face.jpg',
  'grain-fine.jpg',
  'grain-plastic.jpg',
  'cardstock-tile.jpg',
  'legal-tile.jpg',
  'paper-tile.jpg',
  'cork-tile.jpg',
  'leather-tile.jpg',
  'leather-fill-tan-tile.jpg',
  'leather-fill-black-tile.jpg',
  'leather-fill-brown-tile.jpg',
  'leather-frame-tan-soft.png',
  'leather-frame-black-soft.png',
  'leather-frame-brown-soft.png',
  'leather-bar-edge-tan.png',
  'leather-bar-edge-black.png',
  'leather-bar-edge-brown.png',
  'wood-frame.jpg',
  'led-lens-lit.png',
  'led-lens-unlit.png',
];

const TILED_NAMES = [
  'felt-gray-tile.jpg',
  'wood-light-tile.jpg',
  'wood-paneled-tile.jpg',
  'metal-tile.jpg',
  'metal-sandblasted-tile.jpg',
  'cardstock-tile.jpg',
  'legal-tile.jpg',
  'paper-tile.jpg',
  'cork-tile.jpg',
  'leather-tile.jpg',
  'leather-fill-tan-tile.jpg',
  'leather-fill-black-tile.jpg',
  'leather-fill-brown-tile.jpg',
  'grain-fine.jpg',
  'grain-plastic.jpg',
];

// File name to byte ceiling, for files that stay over the budget after lossless optimization.
// The tan and brown frames are 457px alpha images of stitched leather; ImageMagick and Pillow both re-encode it larger than this.
const EXCEPTIONS = { 'leather-frame-tan-soft.png': 217652, 'leather-frame-brown-soft.png': 192111 };
const BUDGET_BYTES = 150 * 1024;

const assetPath = (name) => fileURLToPath(new URL(`../assets/${name}`, import.meta.url));

test('every shipped asset exists', async () => {
  for (const name of ASSET_NAMES) {
    await access(assetPath(name));
  }
});

test('tiles stay within the size budget', async () => {
  for (const name of ASSET_NAMES) {
    const { size } = await stat(assetPath(name));
    const ceiling = EXCEPTIONS[name] ?? BUDGET_BYTES;
    assert.ok(size <= ceiling, `${name} is ${size} bytes, over its ${ceiling} byte ceiling`);
  }
});

test('tiled assets are seamless', () => {
  const script = fileURLToPath(new URL('../tools/texture-pipeline/check_seams.py', import.meta.url));
  execFileSync('python3', ['-I', script, ...TILED_NAMES.map(assetPath)], { stdio: 'pipe' });
});

test('credits cover every asset', async () => {
  const credits = await readFile(new URL('../CREDITS.md', import.meta.url), 'utf8');
  for (const name of ASSET_NAMES) {
    assert.ok(credits.includes(name), `CREDITS.md does not mention ${name}`);
  }
});

// The spiral-metal photo's brightest wedge is 2.2 times its darkest. A ring-only face scores 1.0, which reads as a flat bullseye.
const MINIMUM_REFLECTION_CONTRAST = 1.8;

test('the knob face carries the spiral photo\'s reflections', () => {
  const script = fileURLToPath(new URL('../tools/texture-pipeline/angular_contrast.py', import.meta.url));
  const ratio = Number(execFileSync('python3', ['-I', script, assetPath('knob-face.jpg')], { encoding: 'utf8' }));
  assert.ok(ratio >= MINIMUM_REFLECTION_CONTRAST, `the brightest wedge is only ${ratio} times the darkest`);
});

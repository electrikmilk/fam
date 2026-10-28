import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { access, readFile, stat } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ASSET_NAMES = [
  'felt-gray-tile.jpg',
  'linen-tile.jpg',
  'denim-tile.jpg',
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
  'cardboard-tile.jpg',
  'legal-tile.jpg',
  'paper-tile.jpg',
  'paper-bag-tile.jpg',
  'lined-paper-tile.jpg',
  'grid-paper-tile.jpg',
  'blackboard-tile.jpg',
  'chalkboard-tile.jpg',
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
  'linen-tile.jpg',
  'denim-tile.jpg',
  'wood-light-tile.jpg',
  'wood-paneled-tile.jpg',
  'metal-tile.jpg',
  'metal-sandblasted-tile.jpg',
  'cardstock-tile.jpg',
  'cardboard-tile.jpg',
  'legal-tile.jpg',
  'paper-tile.jpg',
  'paper-bag-tile.jpg',
  'lined-paper-tile.jpg',
  'grid-paper-tile.jpg',
  'blackboard-tile.jpg',
  'chalkboard-tile.jpg',
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

test('credits cite only source photos that are committed', async () => {
  const credits = await readFile(new URL('../CREDITS.md', import.meta.url), 'utf8');
  const cited = [...credits.matchAll(/`([^`\s]*-unsplash\.(?:jpg|png))`/g)].map((match) => match[1]);
  assert.ok(cited.length > 0, 'CREDITS.md cites no source photos');
  const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
  const tracked = new Set(execFileSync('git', ['ls-files', '-z'], { cwd: repositoryRoot, encoding: 'utf8' }).split('\0').map((path) => path.split('/').pop()));
  const untracked = cited.filter((name) => !tracked.has(name));
  assert.deepEqual(untracked, [], 'CREDITS.md cites source photos that are not in the repository');
});

// 0.04 of a 24px cell is about a pixel. The photographed sheet this tile came from was not flat, and cut straight from it the lines strayed by 0.08 and more.
const MAXIMUM_GRID_WANDER = 0.04;

test('the grid paper lines are evenly spaced', () => {
  const script = fileURLToPath(new URL('../tools/texture-pipeline/grid_regularity.py', import.meta.url));
  const wander = Number(execFileSync('python3', ['-I', script, assetPath('grid-paper-tile.jpg'), '12'], { encoding: 'utf8' }));
  assert.ok(wander <= MAXIMUM_GRID_WANDER, `the grid lines stray ${wander} of a cell from even spacing`);
});

// Horizontal planks differ row to row, so the rows spread far more than the columns; the vertical source photo scores well under 1
const MINIMUM_PLANK_DIRECTION_RATIO = 3;

test('the paneled wood planks run horizontally', () => {
  const script = fileURLToPath(new URL('../tools/texture-pipeline/plank_direction.py', import.meta.url));
  const ratio = Number(execFileSync('python3', ['-I', script, assetPath('wood-paneled-tile.jpg')], { encoding: 'utf8' }));
  assert.ok(ratio >= MINIMUM_PLANK_DIRECTION_RATIO, `the rows spread only ${ratio} times the columns`);
});

// The spiral-metal photo's brightest wedge is 2.2 times its darkest. A ring-only face scores 1.0, which reads as a flat bullseye.
const MINIMUM_REFLECTION_CONTRAST = 1.8;

test('the knob face carries the spiral photo\'s reflections', () => {
  const script = fileURLToPath(new URL('../tools/texture-pipeline/angular_contrast.py', import.meta.url));
  const ratio = Number(execFileSync('python3', ['-I', script, assetPath('knob-face.jpg')], { encoding: 'utf8' }));
  assert.ok(ratio >= MINIMUM_REFLECTION_CONTRAST, `the brightest wedge is only ${ratio} times the darkest`);
});

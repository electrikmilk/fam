import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { LAYERS, buildBundle } from '../tools/bundle.mjs';

test('bundle concatenates the five layers in order', async () => {
  const bundlePath = await buildBundle();
  const bundle = await readFile(bundlePath, 'utf8');

  let previousPosition = -1;
  for (const layer of LAYERS) {
    const layerText = await readFile(new URL(`../css/${layer}.css`, import.meta.url), 'utf8');
    const position = bundle.indexOf(layerText);
    assert.ok(position > previousPosition, `${layer} is missing or out of order in the bundle`);
    previousPosition = position;
  }
});

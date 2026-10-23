import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { access, cp, mkdir, mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
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

test('the build script runs from a path that contains a space', async () => {
  const root = join(await mkdtemp(join(tmpdir(), 'fam-space-')), 'fam ui copy');
  await mkdir(join(root, 'tools'), { recursive: true });
  await cp(fileURLToPath(new URL('../tools/bundle.mjs', import.meta.url)), join(root, 'tools/bundle.mjs'));
  await cp(fileURLToPath(new URL('../css', import.meta.url)), join(root, 'css'), { recursive: true });
  execFileSync('node', [join(root, 'tools/bundle.mjs')], { stdio: 'pipe' });
  await access(join(root, 'dist/fam-ui.css'));
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { PNG } from 'pngjs';

const alphaAt = (image, x, y) => image.data[(y * image.width + x) * 4 + 3];

test('the header image has rounded corners and an opaque middle', async () => {
  const image = PNG.sync.read(await readFile(new URL('../docs/header.png', import.meta.url)));
  assert.equal(image.width, 2560);
  assert.equal(image.height, 800);
  for (const [x, y] of [[2, 2], [image.width - 3, 2], [2, image.height - 3], [image.width - 3, image.height - 3]]) {
    assert.equal(alphaAt(image, x, y), 0, `the corner pixel at ${x},${y} is not transparent`);
  }
  assert.equal(alphaAt(image, image.width / 2, 2), 255, 'the top edge, away from the corners, is not opaque');
  assert.equal(alphaAt(image, image.width / 2, image.height / 2), 255);
});

test('the README title is the header image, with no duplicate text title', async () => {
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
  assert.match(readme, /^<h1 align="center"><img src="docs\/header\.png" alt="[^"]*Fam[^"]*"/, 'the README does not open with the header image as its h1');
  assert.ok(!/^# /m.test(readme.split('\n').slice(0, 12).join('\n')), 'a text title still follows the header');
});

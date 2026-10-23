import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { exampleUrl, openUrl } from './helpers/browser.mjs';
import { OFFENDERS_SOURCE } from './helpers/layout.mjs';

const PAGES = ['controls', 'notes', 'sign-in'];
const LOAD_BUDGET_BYTES = 1.5 * 1024 * 1024;

for (const name of PAGES) {
  test(`${name} loads cleanly within the load budget`, async () => {
    const example = await openUrl(exampleUrl(name));
    try {
      assert.deepEqual(example.issues, []);
      const bytes = await example.imageBytes();
      assert.ok(bytes <= LOAD_BUDGET_BYTES, `${name} loads ${bytes} bytes of images`);
    } finally {
      await example.close();
    }
  });

  test(`${name} has no horizontal scroll at phone width`, async () => {
    const example = await openUrl(exampleUrl(name), { viewport: { width: 375, height: 800 } });
    try {
      const { scrollWidth, innerWidth } = await example.page.evaluate(() => ({
        scrollWidth: document.scrollingElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      assert.ok(scrollWidth <= innerWidth, `${name} scrolls sideways: ${scrollWidth}px of content in a ${innerWidth}px viewport`);
      const offenders = await example.page.evaluate(`(${OFFENDERS_SOURCE})()`);
      assert.deepEqual(offenders, [], `${name} content crosses its frame at phone width`);
    } finally {
      await example.close();
    }
  });

  test(`${name} carries the current refraction snippet`, async () => {
    const [page, snippet] = await Promise.all([
      readFile(new URL(`../examples/${name}.html`, import.meta.url), 'utf8'),
      readFile(new URL('../snippets/refraction-filter.html', import.meta.url), 'utf8'),
    ]);
    assert.ok(page.includes(snippet.trim()), `${name}.html has a stale or missing copy of snippets/refraction-filter.html`);
  });
}

test('controls shows five distinct tint swatches', async () => {
  const example = await openUrl(exampleUrl('controls'));
  try {
    const colors = await example.page.$$eval('.fam-swatch', (swatches) => swatches.map((swatch) => getComputedStyle(swatch).backgroundColor));
    assert.equal(colors.length, 5);
    assert.equal(new Set(colors).size, 5);
  } finally {
    await example.close();
  }
});

test('notes keeps the list beside the pad with the 24px rule pitch', async () => {
  const example = await openUrl(exampleUrl('notes'));
  try {
    const { page } = example;
    const list = await page.locator('.fam-notes-list').boundingBox();
    const pad = await page.locator('.fam-pad').boundingBox();
    assert.ok(list.x + list.width <= pad.x + 1, 'the list is not to the left of the pad');
    const sheet = await page.locator('.fam-pad-sheet');
    assert.ok((await sheet.evaluate((node) => getComputedStyle(node).backgroundSize)).includes('585px'));
    assert.equal(await sheet.evaluate((node) => getComputedStyle(node).lineHeight), '24px');
  } finally {
    await example.close();
  }
});

test('list rows are real links, not a listbox that has no keyboard model', async () => {
  const example = await openUrl(exampleUrl('notes'));
  try {
    const { rowTags, fakeOptions } = await example.page.evaluate(() => ({
      rowTags: [...document.querySelectorAll('.fam-list-row')].map((row) => row.tagName),
      fakeOptions: document.querySelectorAll('[role="option"][tabindex]').length,
    }));
    assert.ok(rowTags.length > 0);
    assert.deepEqual([...new Set(rowTags)], ['A']);
    assert.equal(fakeOptions, 0, 'options with their own tab stops promise arrow-key behavior nothing implements');
  } finally {
    await example.close();
  }
});

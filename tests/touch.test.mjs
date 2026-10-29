import assert from 'node:assert/strict';
import test from 'node:test';
import { fixtureUrl, openUrl } from './helpers/browser.mjs';

const PHONE = { viewport: { width: 375, height: 800 }, hasTouch: true };
const IOS_ZOOM_FREE_FONT_PX = 16;

test('text fields are at least 16px on a touch screen, so iOS does not zoom the page on focus', async () => {
  const kit = await openUrl(fixtureUrl('kit'), PHONE);
  try {
    const sizes = await kit.page.$$eval('.fam-field input, .fam-glass-input', (controls) =>
      controls.map((control) => ({ id: control.id || control.className, size: parseFloat(getComputedStyle(control).fontSize) })),
    );
    assert.ok(sizes.length > 0, 'the kit has no fields to check');
    for (const { id, size } of sizes) assert.ok(size >= IOS_ZOOM_FREE_FONT_PX, `${id} is ${size}px`);
  } finally {
    await kit.close();
  }
});

test('text fields keep their compact size with a mouse', async () => {
  const kit = await openUrl(fixtureUrl('kit'), { viewport: { width: 1440, height: 900 } });
  try {
    const size = await kit.page.$eval('.fam-field--sm input', (input) => parseFloat(getComputedStyle(input).fontSize));
    assert.equal(size, 13);
  } finally {
    await kit.close();
  }
});

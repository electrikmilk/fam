import assert from 'node:assert/strict';
import test from 'node:test';
import { fixtureUrl, openUrl, showcasePageUrl } from './helpers/browser.mjs';

const PHONE = { viewport: { width: 375, height: 800 }, hasTouch: true };
const IOS_ZOOM_FREE_FONT_PX = 16;
const COMFORTABLE_TARGET_PX = 44;

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

test('radio buttons are 44px tall to tap on a touch screen', async () => {
  const kit = await openUrl(fixtureUrl('kit'), PHONE);
  try {
    const heights = await kit.page.$$eval('.fam-radio', (radios) => radios.map((radio) => radio.getBoundingClientRect().height));
    assert.ok(heights.length > 0, 'the kit has no radio buttons to check');
    for (const height of heights) assert.ok(height >= COMFORTABLE_TARGET_PX, `a radio button is ${height}px tall`);
  } finally {
    await kit.close();
  }
});

test('the showcase code buttons and standalone footer link are 44px tall to tap on a touch screen', async () => {
  const page = await openUrl(showcasePageUrl('materials'), PHONE);
  try {
    const heights = await page.page.$$eval('.code-head .copy, .code-head .toggle, #credits p:last-child a', (targets) =>
      targets.map((target) => ({ name: target.textContent.trim(), height: target.getBoundingClientRect().height })),
    );
    assert.ok(heights.length > 1, 'the page has no copy buttons or footer link to check');
    for (const { name, height } of heights) assert.ok(height >= COMFORTABLE_TARGET_PX, `"${name}" is ${height}px tall`);
  } finally {
    await page.close();
  }
});

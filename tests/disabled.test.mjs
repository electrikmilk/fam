import assert from 'node:assert/strict';
import test from 'node:test';
import { fixtureUrl, openUrl } from './helpers/browser.mjs';

const read = (page, selector, property) => page.evaluate(([target, name]) => getComputedStyle(document.querySelector(target))[name], [selector, property]);

test('disabled controls look and behave disabled', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    for (const selector of ['#leather-disabled', '#switch-disabled', '#glass-disabled']) {
      assert.equal(await read(page, selector, 'opacity'), '0.5', `${selector} is not dimmed`);
    }
    for (const selector of ['#plastic-disabled', '#metal-button-disabled', '#metal-button-brushed-disabled', '#wood-button-disabled', '#wood-button-paneled-disabled']) {
      assert.equal(await read(page, selector, 'opacity'), '0.7', `${selector} is not a little faded`);
    }
    for (const selector of ['#plastic-disabled', '#metal-button-disabled', '#metal-button-brushed-disabled', '#wood-button-disabled', '#wood-button-paneled-disabled', '#leather-disabled', '#switch-disabled', '#glass-disabled input']) {
      assert.equal(await read(page, selector, 'cursor'), 'default', `${selector} still shows an interactive cursor`);
    }
    for (const selector of ['#plastic-disabled', '#metal-button-disabled', '#metal-button-brushed-disabled', '#wood-button-disabled', '#wood-button-paneled-disabled', '#leather-disabled']) {
      const box = await page.locator(selector).boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      assert.equal(await read(page, selector, 'transform'), 'none', `${selector} sinks when pressed`);
      const pressedShadow = await read(page, selector, 'boxShadow');
      await page.mouse.up();
      assert.equal(await read(page, selector, 'boxShadow'), pressedShadow, `${selector} changes its shadow when pressed`);
    }
  } finally {
    await kit.close();
  }
});

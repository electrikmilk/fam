import assert from 'node:assert/strict';
import test from 'node:test';
import { fixtureUrl, openUrl } from './helpers/browser.mjs';
import { statistics } from './helpers/pixels.mjs';

const read = (page, selector, property, pseudo = null) =>
  page.evaluate(([target, name, pseudoElement]) => getComputedStyle(document.querySelector(target), pseudoElement)[name], [selector, property, pseudo]);

const shadowLayers = (value) => value.split(/,\s(?=rgba?\()/);

// A label's visible strength: its channel average scaled by its alpha, so a white label at half alpha is weaker than a white label
function labelStrength(color) {
  const [red, green, blue, alpha = 1] = color.match(/[\d.]+/g).map(Number);
  return ((red + green + blue) / 3) * alpha;
}

async function faceBrightness(page, selector) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  const box = await page.locator(selector).boundingBox();
  const strip = { x: box.x + box.width * 0.3, y: box.y + box.height - 9, width: box.width * 0.4, height: 4 };
  const { mean } = statistics(await page.screenshot({ clip: strip }));
  return (mean[0] + mean[1] + mean[2]) / 3;
}

test('disabled plastic is inset, a little faded and has a muted label', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    for (const selector of ['#plastic-disabled', '#plastic-round-disabled', '#plastic-square-disabled']) {
      assert.equal(await read(page, selector, 'opacity'), '0.7', `${selector} is not a little faded`);
      for (const layer of shadowLayers(await read(page, selector, 'boxShadow'))) {
        assert.ok(layer.endsWith('inset'), `${selector} still casts an outer shadow: ${layer}`);
      }
      assert.ok(labelStrength(await read(page, selector, 'color')) < labelStrength(await read(page, '#plastic-red', 'color')), `${selector} label is not muted`);
    }
  } finally {
    await kit.close();
  }
});

test('disabled plastic has a darker face than enabled plastic', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    // Opacity would darken the felt-backed button on its own, so measure the face at full opacity
    await page.evaluate(() => {
      for (const id of ['plastic-disabled', 'plastic-red']) document.getElementById(id).style.opacity = '1';
    });
    const enabled = await faceBrightness(page, '#plastic-red');
    const disabled = await faceBrightness(page, '#plastic-disabled');
    assert.ok(disabled < enabled - 8, `the disabled face (${disabled.toFixed(1)}) is not darker than the enabled face (${enabled.toFixed(1)})`);
  } finally {
    await kit.close();
  }
});

test('round and square plastic buttons have a dish and pill buttons do not', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    for (const selector of ['#plastic-square', '#plastic-purple']) {
      assert.equal(await read(page, selector, 'borderRadius', '::after'), '50%', `${selector} has no round dish`);
    }
    assert.equal(await read(page, '#plastic-red', 'content', '::after'), 'none');
  } finally {
    await kit.close();
  }
});

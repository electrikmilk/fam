import assert from 'node:assert/strict';
import test from 'node:test';
import { fixtureUrl, openUrl } from './helpers/browser.mjs';
import { statistics } from './helpers/pixels.mjs';

const read = (page, selector, property, pseudo = null) =>
  page.evaluate(([target, name, pseudoElement]) => getComputedStyle(document.querySelector(target), pseudoElement)[name], [selector, property, pseudo]);

const shadowLayers = (value) => value.split(/,\s(?=rgba?\()/);

async function faceBrightness(page, selector) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  const box = await page.locator(selector).boundingBox();
  const strip = { x: box.x + box.width * 0.3, y: box.y + box.height - 9, width: box.width * 0.4, height: 4 };
  const { mean } = statistics(await page.screenshot({ clip: strip }));
  return (mean[0] + mean[1] + mean[2]) / 3;
}

// Each family of raised button shares one disabled look and one dish rule
const BUTTON_FAMILIES = [
  { name: 'plastic', enabled: '#plastic-red', disabled: ['#plastic-disabled', '#plastic-round-disabled', '#plastic-square-disabled'], dished: ['#plastic-square', '#plastic-purple'], dishless: ['#plastic-red'] },
  { name: 'metal', enabled: '#metal-button-on-felt', disabled: ['#metal-button-disabled'], dished: [], dishless: ['#metal-button', '#metal-round', '#metal-square'] },
];

const labelAlpha = (color) => Number(color.match(/[\d.]+/g)[3] ?? 1);

for (const family of BUTTON_FAMILIES) {
  test(`disabled ${family.name} is inset, a little faded and has a muted label`, async () => {
    const kit = await openUrl(fixtureUrl('kit'));
    try {
      const { page } = kit;
      for (const selector of family.disabled) {
        assert.equal(await read(page, selector, 'opacity'), '0.7', `${selector} is not a little faded`);
        for (const layer of shadowLayers(await read(page, selector, 'boxShadow'))) {
          assert.ok(layer.endsWith('inset'), `${selector} still casts an outer shadow: ${layer}`);
        }
        assert.ok(labelAlpha(await read(page, selector, 'color')) < labelAlpha(await read(page, family.enabled, 'color')), `${selector} label is not muted`);
      }
    } finally {
      await kit.close();
    }
  });

  test(`disabled ${family.name} has a darker face than enabled ${family.name}`, async () => {
    const kit = await openUrl(fixtureUrl('kit'));
    try {
      const { page } = kit;
      // Opacity would darken a button on a dark surface on its own, so measure the face at full opacity
      await page.evaluate((ids) => {
        for (const selector of ids) document.querySelector(selector).style.opacity = '1';
      }, [family.enabled, family.disabled[0]]);
      const enabled = await faceBrightness(page, family.enabled);
      const disabled = await faceBrightness(page, family.disabled[0]);
      assert.ok(disabled < enabled - 8, `the disabled face (${disabled.toFixed(1)}) is not darker than the enabled face (${enabled.toFixed(1)})`);
    } finally {
      await kit.close();
    }
  });

  test(`${family.name} buttons have a dish only where the family has one`, async () => {
    const kit = await openUrl(fixtureUrl('kit'));
    try {
      const { page } = kit;
      for (const selector of family.dished) {
        assert.equal(await read(page, selector, 'borderRadius', '::after'), '50%', `${selector} has no round dish`);
      }
      for (const selector of family.dishless) assert.equal(await read(page, selector, 'content', '::after'), 'none', `${selector} should have no dish`);
    } finally {
      await kit.close();
    }
  });
}

test('metal buttons are made from the brushed metal texture', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    assert.ok((await read(kit.page, '#metal-button', 'backgroundImage')).includes('metal-brushed.jpg'));
  } finally {
    await kit.close();
  }
});

test('glossy buttons are real buttons with an aqua gradient body and a dialable gloss', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    for (const selector of ['#glossy-button', '#glossy-silver']) {
      assert.equal(await page.evaluate((target) => document.querySelector(target).tagName, selector), 'BUTTON');
      assert.ok((await read(page, selector, 'backgroundImage')).includes('linear-gradient'), `${selector} has no gradient body`);
    }
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('#glossy-button')).getPropertyValue('--fam-gloss').trim()), '.28');
    assert.notEqual(await read(page, '#glossy-button', 'backgroundImage'), await read(page, '#glossy-silver', 'backgroundImage'));
  } finally {
    await kit.close();
  }
});

test('glass buttons are frosted with a white label', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    assert.ok((await read(page, '#glass-button', 'backdropFilter', '::before')).includes('blur'));
    assert.equal(await read(page, '#glass-button', 'color'), 'rgb(255, 255, 255)');
  } finally {
    await kit.close();
  }
});

test('disabled glossy and glass buttons are dimmed and show no interactive cursor', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    for (const selector of ['#glossy-disabled', '#glass-button-disabled']) {
      assert.equal(await read(kit.page, selector, 'opacity'), '0.5', `${selector} is not dimmed`);
      assert.equal(await read(kit.page, selector, 'cursor'), 'default', `${selector} still shows an interactive cursor`);
    }
  } finally {
    await kit.close();
  }
});

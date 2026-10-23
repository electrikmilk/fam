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

const LED = 'rgb(255, 106, 31)';

test('group cells share one case', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    const radii = (selector) => page.evaluate((target) => {
      const style = getComputedStyle(document.querySelector(target));
      return [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomRightRadius, style.borderBottomLeftRadius];
    }, selector);
    const cells = '#group-plastic > button';
    const [first, middle, last] = [`${cells}:nth-child(1)`, `${cells}:nth-child(2)`, `${cells}:nth-child(4)`];
    assert.notEqual((await radii(first))[0], '0px');
    assert.deepEqual((await radii(first)).slice(1, 3), ['0px', '0px']);
    assert.deepEqual(await radii(middle), ['0px', '0px', '0px', '0px']);
    assert.notEqual((await radii(last))[1], '0px');
    assert.deepEqual([(await radii(last))[0], (await radii(last))[3]], ['0px', '0px']);
  } finally {
    await kit.close();
  }
});

test('a pressed or selected cell shows the LED and an unpressed one does not', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    assert.ok((await read(page, '#group-pressed', 'backgroundImage', '::after')).includes(LED), 'the pressed cell has no LED');
    assert.ok((await read(page, '#group-selected', 'backgroundImage', '::after')).includes(LED), 'aria-selected does not light the cell');
    assert.ok(!(await read(page, '#group-unpressed', 'backgroundImage', '::after')).includes(LED), 'the unpressed cell is lit');
    assert.equal(await read(page, '#group-metal-lit', 'content', '::after'), '""', 'the pressed metal cell has no LED dot');
    assert.equal(await read(page, '#group-metal-lit', 'backgroundColor', '::after'), LED);
  } finally {
    await kit.close();
  }
});

test('lit glossy and leather cells look different from plain ones', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    assert.notEqual(await read(page, '#group-glossy-lit', 'backgroundImage'), await read(page, '#group-glossy-plain', 'backgroundImage'));
    assert.notEqual(await read(page, '#group-leather-lit', 'boxShadow'), await read(page, '#group-leather-plain', 'boxShadow'));
  } finally {
    await kit.close();
  }
});

test('a disabled pressed cell stays inset with a dim LED', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    const selector = '#group-disabled-pressed';
    assert.equal(await read(page, selector, 'opacity'), '0.7');
    for (const layer of shadowLayers(await read(page, selector, 'boxShadow'))) assert.ok(layer.endsWith('inset'), layer);
    assert.ok((await read(page, selector, 'backgroundImage', '::after')).includes(LED));
  } finally {
    await kit.close();
  }
});

test('group cells ease their look and stop under reduced motion', async () => {
  const moving = await openUrl(fixtureUrl('kit'));
  try {
    assert.notEqual(await read(moving.page, '#group-pressed', 'transitionDuration'), '0s');
  } finally {
    await moving.close();
  }
  const still = await openUrl(fixtureUrl('kit'), { reducedMotion: 'reduce' });
  try {
    assert.equal(await read(still.page, '#group-pressed', 'transitionDuration'), '0s');
  } finally {
    await still.close();
  }
});

test('a long group scrolls inside itself on a phone instead of overflowing', async () => {
  const kit = await openUrl(fixtureUrl('kit'), { viewport: { width: 375, height: 800 } });
  try {
    const { page } = kit;
    const group = await page.evaluate(() => {
      const element = document.querySelector('#group-long');
      return { right: element.getBoundingClientRect().right, scrollWidth: element.scrollWidth, clientWidth: element.clientWidth };
    });
    assert.ok(group.right <= 375, `the group reaches ${group.right}px`);
    assert.ok(group.scrollWidth > group.clientWidth, 'the group does not scroll inside itself');
  } finally {
    await kit.close();
  }
});

test('a leather group is a leather case like the leather navigation, with the lit cell cut as a dark pocket', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    assert.ok((await read(page, '#group-leather', 'backgroundImage')).includes('leather-fill-tan-tile'), 'the case is not leather');
    assert.equal(await read(page, '#group-leather-plain', 'color'), 'rgb(0, 0, 0)');
    assert.equal(await read(page, '#group-leather-lit', 'color'), 'rgb(236, 227, 207)');
    assert.ok((await read(page, '#group-leather-lit', 'backgroundImage')).includes('rgba(30, 14, 3'), 'the lit cell is not the nav pocket');
    assert.equal(await read(page, '#group-leather-plain', 'backgroundImage'), 'none', 'a plain cell has its own button face');
  } finally {
    await kit.close();
  }
});

const radioDot = (id) => `#${id}`;

test('checked plastic and metal radios glow like an LED and unchecked ones do not', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    for (const id of ['radio-plastic-on', 'radio-metal-on']) {
      assert.ok((await read(page, radioDot(id), 'boxShadow')).includes('255, 106, 31'), `${id} does not glow`);
    }
    assert.ok(!(await read(page, radioDot('radio-plastic-off'), 'boxShadow')).includes('255, 106, 31'), 'an unchecked radio glows');
  } finally {
    await kit.close();
  }
});

test('checked glossy and glass radios show a dot with no glow', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    for (const id of ['radio-glossy-on', 'radio-glass-on']) {
      assert.equal(await read(page, radioDot(id), 'content', '::after'), '""', `${id} shows no dot`);
      assert.ok(!(await read(page, radioDot(id), 'boxShadow')).includes('255, 106, 31'), `${id} glows`);
    }
  } finally {
    await kit.close();
  }
});

test('arrow keys move the selection inside one radio group', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    await page.locator('#speed-1').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.isChecked('#speed-2'), true);
    assert.equal(await page.isChecked('#speed-1'), false);
    assert.equal(await page.evaluate(() => document.querySelectorAll('input[name=speed]:checked').length), 1);
  } finally {
    await kit.close();
  }
});

test('a disabled radio is dimmed, shows no interactive cursor and is skipped by Tab', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    assert.equal(await read(page, '#radio-plastic-disabled-label', 'opacity'), '0.5');
    assert.equal(await read(page, '#radio-plastic-disabled-label', 'cursor'), 'default');
    await page.locator('#radio-plastic-disabled-label').scrollIntoViewIfNeeded();
    await page.evaluate(() => document.querySelector('#glossy-disabled').focus());
    for (let press = 0; press < 3; press += 1) {
      await page.keyboard.press('Tab');
      assert.notEqual(await page.evaluate(() => document.activeElement.id), 'radio-plastic-disabled');
    }
  } finally {
    await kit.close();
  }
});

test('the radio glow does not animate under reduced motion', async () => {
  const moving = await openUrl(fixtureUrl('kit'));
  try {
    assert.notEqual(await read(moving.page, radioDot('radio-plastic-on'), 'transitionDuration'), '0s');
  } finally {
    await moving.close();
  }
  const still = await openUrl(fixtureUrl('kit'), { reducedMotion: 'reduce' });
  try {
    assert.equal(await read(still.page, radioDot('radio-plastic-on'), 'transitionDuration'), '0s');
  } finally {
    await still.close();
  }
});

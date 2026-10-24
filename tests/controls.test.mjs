import assert from 'node:assert/strict';
import test from 'node:test';
import { fixtureUrl, isChromium, openUrl } from './helpers/browser.mjs';
import { statistics } from './helpers/pixels.mjs';

// Safari and WebKit skip links and buttons on Tab by default; Option+Tab visits every focusable control
const TAB_KEY = process.env.FAM_BROWSER === 'webkit' ? 'Alt+Tab' : 'Tab';

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

test('light glass buttons have a dark label and blue glass buttons keep the white one', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    assert.equal(await read(page, '#glass-button-light', 'color'), 'rgb(20, 22, 28)');
    assert.equal(await read(page, '#glass-button-blue', 'color'), 'rgb(255, 255, 255)');
    assert.ok((await read(page, '#glass-button-blue', 'backgroundImage', '::before')).includes('rgba(36, 63, 160, 0.72)'));
  } finally {
    await kit.close();
  }
});

test('a checked glass radio dot is blue and an unchecked one stays dark', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    assert.ok((await read(page, radioDot('radio-glass-on'), 'backgroundImage')).includes('rgba(36, 63, 160, 0.72)'));
    await page.locator('#radio-glass-input').evaluate((input) => { input.checked = false; });
    assert.ok((await read(page, radioDot('radio-glass-on'), 'backgroundImage')).includes('rgba(0, 0, 0, 0.42)'));
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
const LIT_LENS = 'led-lens-lit';

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
    assert.ok((await read(page, '#group-pressed', 'backgroundImage', '::after')).includes(LIT_LENS), 'the pressed cell has no LED');
    assert.equal(await read(page, '#group-pressed', 'opacity', '::after'), '1', 'the pressed cell is not lit');
    assert.equal(await read(page, '#group-selected', 'opacity', '::after'), '1', 'aria-selected does not light the cell');
    assert.equal(await read(page, '#group-unpressed', 'opacity', '::after'), '0', 'the unpressed cell is lit');
    for (const cell of ['#group-unpressed', '#group-pressed', '#group-metal-lit']) {
      assert.ok((await read(page, cell, 'backgroundImage', '::before')).includes('led-lens-unlit'), `${cell} does not keep the dark lens under the lit one`);
    }
    assert.equal(await read(page, '#group-metal-lit', 'content', '::after'), '""', 'the pressed metal cell has no LED dot');
    assert.ok((await read(page, '#group-metal-lit', 'backgroundImage', '::after')).includes(LIT_LENS), 'the LED dot has no lens');
    assert.equal(await read(page, '#group-metal-lit', 'backgroundColor', '::after'), LED);
  } finally {
    await kit.close();
  }
});

test('a lit cell fades in quickly and out slowly, and does neither under reduced motion', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    assert.equal(await read(kit.page, '#group-unpressed', 'transitionDuration', '::after'), '0.5s');
    assert.equal(await read(kit.page, '#group-pressed', 'transitionDuration', '::after'), '0.12s');
  } finally {
    await kit.close();
  }
  const still = await openUrl(fixtureUrl('kit'), { reducedMotion: 'reduce' });
  try {
    for (const cell of ['#group-unpressed', '#group-pressed', '#group-metal-lit']) {
      assert.equal(await read(still.page, cell, 'transitionProperty', '::after'), 'none', `${cell} still fades`);
    }
  } finally {
    await still.close();
  }
});

test('a group of plastic or metal cells sits in a recessed well', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    const groupOf = (cell) => page.evaluate((selector) => {
      const style = getComputedStyle(document.querySelector(selector).closest('.fam-button-group'));
      return { padding: style.paddingLeft, shadow: style.boxShadow };
    }, cell);
    for (const cell of ['#group-pressed', '#group-metal-lit']) {
      const group = await groupOf(cell);
      assert.equal(group.padding, '6px', `${cell} has no padding around its cells`);
      assert.ok(group.shadow.includes('inset'), `${cell} is not recessed`);
    }
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
    assert.ok((await read(page, selector, 'backgroundImage', '::after')).includes(LIT_LENS));
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
    assert.equal(await read(page, '#radio-plastic-disabled-label', 'opacity'), '0.7', 'a disabled plastic radio fades as much as a disabled plastic button');
    assert.equal(await read(page, '#radio-plastic-disabled-label', 'cursor'), 'default');
    await page.locator('#radio-plastic-disabled-label').scrollIntoViewIfNeeded();
    await page.evaluate(() => document.querySelector('#glossy-disabled').focus());
    for (let press = 0; press < 3; press += 1) {
      await page.keyboard.press(TAB_KEY);
      assert.notEqual(await page.evaluate(() => document.activeElement.id), 'radio-plastic-disabled');
    }
  } finally {
    await kit.close();
  }
});

const litLensOpacity = (page, selector) => page.evaluate((target) => getComputedStyle(document.querySelector(`${target} .fam-led-lens`), '::after').opacity, selector);
const waitForLitLensOpacity = (page, selector, opacity) => page.waitForFunction(([target, expected]) => getComputedStyle(document.querySelector(`${target} .fam-led-lens`), '::after').opacity === expected, [selector, opacity]);

test('an LED toggle lights while checked and a disabled one stays as it is', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    assert.equal(await litLensOpacity(page, '#led-toggle'), '0');
    await page.locator('#led-toggle').scrollIntoViewIfNeeded();
    await page.locator('#led-toggle').click();
    assert.equal(await page.isChecked('#led-toggle input'), true);
    await waitForLitLensOpacity(page, '#led-toggle', '1');
    await page.keyboard.press('Space');
    assert.equal(await page.isChecked('#led-toggle input'), false, 'Space did not toggle the focused LED');
    await waitForLitLensOpacity(page, '#led-toggle', '0');
    assert.equal(await read(page, '#led-toggle-disabled', 'opacity'), '0.7');
    await page.locator('#led-toggle-disabled input').click({ force: true });
    assert.equal(await page.isChecked('#led-toggle-disabled input'), false);
  } finally {
    await kit.close();
  }
});

test('a lit LED fades in quickly and out slowly, and does neither under reduced motion', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const duration = (selector) => read(kit.page, `${selector} .fam-led-lens`, 'transitionDuration', '::after');
    assert.equal(await duration('#led-unlit'), '0.5s');
    assert.equal(await duration('#led-lit'), '0.12s');
  } finally {
    await kit.close();
  }
  const still = await openUrl(fixtureUrl('kit'), { reducedMotion: 'reduce' });
  try {
    assert.equal(await read(still.page, '#led-lit .fam-led-lens', 'transitionProperty', '::after'), 'none');
    assert.equal(await read(still.page, '#led-unlit .fam-led-lens', 'transitionProperty', '::after'), 'none');
  } finally {
    await still.close();
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

const TAB_STRIPS = [
  ['silver', '#tab-silver-selected', '#tab-silver-plain'],
  ['plastic', '#tab-plastic-selected', '#tab-plastic-plain'],
  ['metal', '#tab-metal-selected', '#tab-metal-plain'],
  ['wood', '#tab-wood-selected', '#tab-wood-plain'],
  ['leather', '#tab-leather-selected', '#tab-leather-plain'],
  ['leather on leather', '#tab-lol-selected', '#tab-lol-plain'],
];

const lookOf = (page, selector) =>
  page.evaluate((target) => {
    const style = getComputedStyle(document.querySelector(target));
    const dot = getComputedStyle(document.querySelector(target), '::after');
    return [style.backgroundImage, style.boxShadow, style.color, dot.content, dot.backgroundColor].join(' | ');
  }, selector);

for (const [name, selected, plain] of TAB_STRIPS) {
  test(`a selected ${name} tab differs from a plain one`, async () => {
    const kit = await openUrl(fixtureUrl('kit'));
    try {
      assert.notEqual(await lookOf(kit.page, selected), await lookOf(kit.page, plain));
    } finally {
      await kit.close();
    }
  });
}

test('a disabled tab is skipped by Tab', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    await page.locator('#tab-silver-plain').focus();
    await page.keyboard.press(TAB_KEY);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'tab-silver-selected');
    await page.keyboard.press(TAB_KEY);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'tab-silver-last');
  } finally {
    await kit.close();
  }
});

test('a wood group is a pill of wood with the nav bar pocket for the selected tab', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    assert.ok((await read(page, '#tabs-wood', 'backgroundImage')).includes('wood-light-tile'));
    assert.equal(await read(page, '#tab-wood-plain', 'boxShadow'), 'none');
    assert.ok((await read(page, '#tab-wood-selected', 'boxShadow')).includes('inset'));
  } finally {
    await kit.close();
  }
});

test('a case group pads its cells inside a plastic case like the strip in plastic.png', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    assert.equal(await read(page, '#tabs-plastic', 'paddingTop'), '5px');
    assert.ok((await read(page, '#tabs-plastic', 'backgroundImage')).includes('linear-gradient'));
    for (const cell of ['#tab-plastic-plain', '#tab-plastic-selected']) {
      assert.equal(await read(page, cell, 'borderTopLeftRadius'), '8px');
      assert.equal(await read(page, cell, 'borderTopRightRadius'), '8px');
    }
  } finally {
    await kit.close();
  }
});

test('a leather group has its own dark rim so it stands out on leather', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    assert.ok((await read(kit.page, '#tabs-leather-on-leather', 'boxShadow')).includes('rgba(60, 30, 8, 0.55)'));
  } finally {
    await kit.close();
  }
});

test('a selected tab is marked in forced colors', { skip: !isChromium && 'forced-colors emulation is only reliable in Chromium' }, async () => {
  const kit = await openUrl(fixtureUrl('kit'), { forcedColors: 'active' });
  try {
    for (const [, selected, plain] of TAB_STRIPS) {
      assert.notEqual(await read(kit.page, selected, 'outlineStyle'), 'none', `${selected} is not marked`);
      assert.equal(await read(kit.page, plain, 'outlineStyle'), 'none');
    }
  } finally {
    await kit.close();
  }
});

test('the plastic panel is a textured gradient', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const background = await read(kit.page, '#plastic-panel', 'backgroundImage');
    assert.ok(background.includes('linear-gradient') && background.includes('grain-fine.jpg'), background);
  } finally {
    await kit.close();
  }
});

test('the dial turns with --fam-knob-angle and is labeled', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('#dial')).getPropertyValue('--fam-knob-angle').trim()), '35deg');
    assert.notEqual(await read(page, '#dial', 'transform', '::after'), await read(page, '#dial-low', 'transform', '::after'));
    for (const id of ['dial', 'dial-low']) {
      assert.equal(await page.getAttribute(`#${id}`, 'role'), 'img');
      assert.ok((await page.getAttribute(`#${id}`, 'aria-label')).length > 0);
    }
  } finally {
    await kit.close();
  }
});

test('every plastic surface carries the fine grain', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    const surfaces = [
      ['plastic button', '#plastic-red', null],
      ['disabled plastic button', '#plastic-disabled', null],
      ['plastic panel', '#plastic-panel', null],
      ['plastic radio', '#grain-radio', null],
      ['plastic case', '#tabs-plastic', null],
      ['dial face', '#dial', '::before'],
    ];
    for (const [name, selector, pseudo] of surfaces) {
      assert.ok((await read(page, selector, 'backgroundImage', pseudo)).includes('grain-fine.jpg'), `the ${name} has no grain`);
    }
  } finally {
    await kit.close();
  }
});

const shadowsOf = async (page, selector, pseudo = null) => shadowLayers(await read(page, selector, 'boxShadow', pseudo));
const isOrange = (layer) => /rgba?\(255, (9\d|1\d\d), (\d{1,2}|1\d\d)/.test(layer);
const isInset = (layer) => layer.endsWith('inset');

test('the metal nav current item is a darker inset with a light label', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    await page.locator('#nav-metal').scrollIntoViewIfNeeded();
    const underLabel = async (selector) => {
      const box = await page.locator(selector).boundingBox();
      const { mean } = statistics(await page.screenshot({ clip: { x: box.x + 6, y: box.y + box.height - 5, width: box.width - 12, height: 3 } }));
      return (mean[0] + mean[1] + mean[2]) / 3;
    };
    const current = await underLabel('#nav-metal-current');
    const plain = await underLabel('#nav-metal-plain');
    assert.ok(current < plain - 40, `the current item (${current.toFixed(1)}) is not much darker than a plain one (${plain.toFixed(1)})`);
    assert.equal(await read(page, '#nav-metal-current', 'color'), 'rgb(236, 234, 228)');
    assert.equal(await read(page, '#nav-metal-plain', 'color'), 'rgb(18, 20, 26)');
  } finally {
    await kit.close();
  }
});

test('a lit plastic or metal cell is inset and an unlit one is raised', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    for (const selector of ['#group-pressed', '#group-selected', '#group-metal-lit']) {
      for (const layer of await shadowsOf(page, selector)) assert.ok(isInset(layer), `${selector} still casts an outer shadow: ${layer}`);
    }
    assert.ok((await shadowsOf(page, '#group-unpressed')).some((layer) => !isInset(layer)), 'an unlit cell should be raised');
  } finally {
    await kit.close();
  }
});

test('the LED glows itself and lights the surface around it', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    for (const [name, selector] of [['dish LED', '#group-pressed'], ['LED dot', '#group-metal-lit']]) {
      const layers = await shadowsOf(page, selector, '::after');
      assert.ok((await read(page, selector, 'backgroundImage', '::after')).includes(LIT_LENS), `the ${name} is not the glowing lens`);
      assert.ok(layers.filter((layer) => !isInset(layer) && isOrange(layer)).length >= 1, `the ${name} does not light its surroundings`);
    }
    assert.ok((await shadowsOf(page, '#group-metal-lit', '::after')).filter((layer) => !isInset(layer) && isOrange(layer)).length >= 2, 'the LED dot has one halo, not a core and a halo');
  } finally {
    await kit.close();
  }
});

test('a checked LED radio glows like the active switch: an outer glow, an inner glow and a glowing LED', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    for (const id of ['radio-plastic-on', 'radio-metal-on']) {
      const dot = await shadowsOf(page, `#${id}`);
      assert.ok(dot.some((layer) => !isInset(layer) && isOrange(layer)), `${id} has no outer glow`);
      assert.ok(dot.some((layer) => isInset(layer) && isOrange(layer)), `${id} has no inner glow`);
      assert.ok((await shadowsOf(page, `#${id}`, '::after')).some((layer) => !isInset(layer) && isOrange(layer)), `the LED in ${id} does not glow`);
    }
    assert.ok(!(await shadowsOf(page, '#radio-plastic-off')).some(isOrange), 'an unchecked radio glows');
  } finally {
    await kit.close();
  }
});

test('a focused selected tab keeps a focus ring in forced colors', { skip: !isChromium && 'forced-colors emulation is only reliable in Chromium' }, async () => {
  const kit = await openUrl(fixtureUrl('kit'), { forcedColors: 'active' });
  try {
    const { page } = kit;
    for (const selector of ['#tab-silver-selected', '#tab-plastic-selected', '#tab-metal-selected', '#tab-leather-selected', '#tab-wood-selected']) {
      const resting = await read(page, selector, 'outlineOffset');
      await page.locator(selector).focus();
      assert.notEqual(await read(page, selector, 'outlineOffset'), resting, `${selector} looks the same focused as at rest`);
      assert.ok((await read(page, selector, 'textDecorationLine')).includes('underline'), `${selector} loses its selected marker when focused`);
    }
  } finally {
    await kit.close();
  }
});

test('a disabled wood tab is dimmed and shows no interactive cursor', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    assert.equal(await read(kit.page, '#tab-wood-disabled', 'opacity'), '0.5');
    assert.equal(await read(kit.page, '#tab-wood-disabled', 'cursor'), 'default');
  } finally {
    await kit.close();
  }
});

test('a focused group cell rises above its neighbours so its ring is not cut off', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    for (const selector of ['#tab-metal-plain', '#tab-leather-plain', '#tab-wood-plain']) {
      assert.equal(await read(page, selector, 'zIndex'), 'auto');
      await page.locator(selector).focus();
      assert.equal(await read(page, selector, 'zIndex'), '1', `${selector} stays under its neighbour`);
    }
  } finally {
    await kit.close();
  }
});

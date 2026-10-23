import assert from 'node:assert/strict';
import test from 'node:test';
import { fixtureUrl, isChromium, openUrl } from './helpers/browser.mjs';

// Windows high contrast mode replaces authored colors and removes box-shadows and background gradients,
// so state and focus must also be carried by system colors, borders and outlines.
const options = { skip: !isChromium && 'forced-colors emulation is only reliable in Chromium' };

const read = (page, selector, property) => page.evaluate(([target, name]) => getComputedStyle(document.querySelector(target))[name], [selector, property]);

test('progress bars stay visible in forced colors', options, async () => {
  const kit = await openUrl(fixtureUrl('kit'), { forcedColors: 'active' });
  try {
    assert.notEqual(await read(kit.page, '#candy', 'backgroundColor'), 'rgba(0, 0, 0, 0)', 'the fill has no color');
    assert.notEqual(await read(kit.page, '.fam-progress', 'borderTopStyle'), 'none', 'the track has no border');
  } finally {
    await kit.close();
  }
});

test('selected and current states differ from the rest in forced colors', options, async () => {
  const kit = await openUrl(fixtureUrl('kit'), { forcedColors: 'active' });
  try {
    const { page } = kit;
    assert.notEqual(await read(page, '#row-selected', 'backgroundColor'), await read(page, '#row-plain', 'backgroundColor'));
    assert.notEqual(await read(page, '#menu-selected', 'backgroundColor'), await read(page, '#menu li:first-child', 'backgroundColor'));
    assert.ok((await read(page, '#nav-current', 'textDecorationLine')).includes('underline'), 'the current nav item is not marked');
    assert.notEqual(await read(page, '#switch-on', 'backgroundColor'), await read(page, '#switch-off', 'backgroundColor'), 'on and off switches look the same');
  } finally {
    await kit.close();
  }
});

test('focus draws a real outline on glass, recessed and search fields in forced colors', options, async () => {
  const kit = await openUrl(fixtureUrl('kit'), { forcedColors: 'active' });
  try {
    const { page } = kit;
    for (const [input, wrapper] of [['#glass-input', '.fam-glass'], ['#recessed-input', '.fam-recessed'], ['#search-input', '.fam-search']]) {
      await page.focus(input);
      const outline = await page.evaluate(
        ([inputSelector, wrapperSelector]) => {
          const style = getComputedStyle(document.querySelector(inputSelector).closest(wrapperSelector));
          return `${style.outlineStyle} ${style.outlineWidth}`;
        },
        [input, wrapper],
      );
      assert.ok(outline.startsWith('solid') && !outline.endsWith(' 0px'), `${wrapper} shows no outline when focused: ${outline}`);
    }
  } finally {
    await kit.close();
  }
});

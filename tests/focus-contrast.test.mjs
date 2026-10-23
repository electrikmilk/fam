import assert from 'node:assert/strict';
import test from 'node:test';
import { fixtureUrl, openUrl } from './helpers/browser.mjs';
import { changedPixelContrast } from './helpers/pixels.mjs';

// Each control on the surface the kit puts it on. The visible box is the wrapper that draws the ring, or the control itself.
const CONTROLS = [
  ['glass field on felt', '#glass-input', '.fam-glass'],
  ['plastic button on felt', '#plastic-red', null],
  ['switch on felt', '#switch-off input', '.fam-switch'],
  ['plastic button on metal', '#plastic-on-metal', null],
  ['metal button on felt', '#metal-button-on-felt', null],
  ['metal button on metal', '#metal-button', null],
  ['glossy button on metal', '#glossy-button', null],
  ['glossy silver button on metal', '#glossy-silver', null],
  ['glass button on felt', '#glass-button', null],
  ['plastic radio on metal', '#speed-2', '.fam-radio'],
  ['glass radio on felt', '#radio-glass-input', '.fam-radio'],
  ['plastic button on the plastic panel', '#plastic-on-panel', null],
  ['switch on metal', '#switch-on-metal input', '.fam-switch'],
  ['recessed field on leather', '#recessed-input', '.fam-recessed'],
  ['leather button on leather', '#leather-button', null],
  ['search pill on paper', '#search-input', '.fam-search'],
  ['nav link on wood', '#nav-link', null],
  ['list row on paper', '#row-plain', null],
];

// WCAG 1.4.11: a focus indicator needs 3:1 against the pixels next to it. A two-tone ring (light and dark) meets that on any
// surface because at least one tone contrasts, so the test accepts a ring when a third of its pixels do.
const REQUIRED_FRACTION = 0.33;
const MINIMUM_RING_PIXELS = 40;

for (const [name, inputSelector, wrapperSelector] of CONTROLS) {
  test(`focus ring on the ${name} contrasts with the surface`, async () => {
    const kit = await openUrl(fixtureUrl('kit'));
    try {
      const { page } = kit;
      const input = page.locator(inputSelector);
      await input.scrollIntoViewIfNeeded();
      const box = wrapperSelector ? await input.locator(`xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " ${wrapperSelector.slice(1)} ")][1]`).boundingBox() : await input.boundingBox();
      const clip = { x: Math.max(0, box.x - 10), y: Math.max(0, box.y - 10), width: box.width + 20, height: box.height + 20 };
      await page.evaluate(() => document.activeElement?.blur());
      const before = await page.screenshot({ clip });
      await input.focus();
      await page.waitForTimeout(150);
      const after = await page.screenshot({ clip });
      const { changed, fraction } = changedPixelContrast(before, after);
      assert.ok(changed >= MINIMUM_RING_PIXELS, `no visible ring: only ${changed} pixels changed`);
      assert.ok(fraction >= REQUIRED_FRACTION, `only ${(fraction * 100).toFixed(0)}% of the ring pixels reach 3:1 against the surface`);
    } finally {
      await kit.close();
    }
  });
}

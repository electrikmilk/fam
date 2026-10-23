import assert from 'node:assert/strict';
import test from 'node:test';
import { fixtureUrl, openUrl } from './helpers/browser.mjs';

test('thread color is the leather color lifted 35% toward white', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { thread, expected, lift } = await kit.page.evaluate(() => {
      const probe = document.createElement('div');
      probe.style.backgroundColor = 'color-mix(in srgb, white 35%, #8a5a30)';
      document.body.append(probe);
      return {
        thread: getComputedStyle(document.getElementById('stitched'), '::after').backgroundColor,
        expected: getComputedStyle(probe).backgroundColor,
        lift: getComputedStyle(document.getElementById('stitched')).getPropertyValue('--fam-stitch-lift').trim(),
      };
    });
    assert.equal(lift, '35%');
    assert.equal(thread, expected);
  } finally {
    await kit.close();
  }
});

test('stitches are hidden where the mask is unsupported', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { supported, display } = await kit.page.evaluate(() => ({
      supported: CSS.supports('-webkit-mask-box-image-source', 'none'),
      display: getComputedStyle(document.getElementById('stitched'), '::after').display,
    }));
    // Where the mask is missing, a dashed border would stand in for the thread, which the spec calls an anti-goal
    assert.equal(display, supported ? 'block' : 'none');
  } finally {
    await kit.close();
  }
});

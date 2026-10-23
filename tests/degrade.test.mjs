import assert from 'node:assert/strict';
import test from 'node:test';
import { fixtureUrl, openUrl } from './helpers/browser.mjs';

const ENGINE_NAMES = { chrome: 'chromium', firefox: 'firefox', webkit: 'webkit' };

const style = (page, selector, pseudo, property) =>
  page.evaluate(([target, pseudoElement, name]) => getComputedStyle(document.querySelector(target), pseudoElement)[name], [selector, pseudo, property]);

test('the requested engine is the one that runs', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const requested = process.env.FAM_BROWSER ?? 'chrome';
    assert.equal(kit.page.context().browser().browserType().name(), ENGINE_NAMES[requested]);
  } finally {
    await kit.close();
  }
});

test('glass keeps its dark shade, so text stays readable without backdrop blur', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const shade = await style(kit.page, '#glass', '::before', 'backgroundImage');
    assert.ok(shade.includes('rgba(0, 0, 0, 0.42)'), shade);
  } finally {
    await kit.close();
  }
});

test('refracting glass stays a clear pane with a highlight and no dark shade', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const pane = await style(kit.page, '#glass-refract', '::before', 'backgroundImage');
    assert.ok(pane.includes('rgba(255, 255, 255, 0.24)'), pane);
    assert.ok(!pane.includes('rgba(0, 0, 0'), pane);
  } finally {
    await kit.close();
  }
});

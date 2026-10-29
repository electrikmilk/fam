import assert from 'node:assert/strict';
import test from 'node:test';
import { fixtureUrl, openUrl } from './helpers/browser.mjs';

const style = (page, selector, pseudo, property) =>
  page.evaluate(([target, pseudoElement, name]) => getComputedStyle(document.querySelector(target), pseudoElement)[name], [selector, pseudo, property]);

const customProperty = (page, selector, name) =>
  page.evaluate(([target, property]) => getComputedStyle(document.querySelector(target)).getPropertyValue(property).trim(), [selector, name]);

test('switch toggles without JavaScript', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    // The track fades over 200ms, so wait for the computed opacity to settle instead of sleeping
    const settledTrackOpacity = (expected) =>
      page.waitForFunction(
        (want) => getComputedStyle(document.querySelector('#switch-off'), '::before').opacity === want,
        expected,
        { timeout: 3000 },
      );
    await settledTrackOpacity('0');
    await page.click('#switch-off');
    assert.equal(await page.isChecked('#switch-off input'), true);
    await settledTrackOpacity('1');
    await page.focus('#switch-off input');
    await page.keyboard.press('Space');
    assert.equal(await page.isChecked('#switch-off input'), false);
    await settledTrackOpacity('0');
    assert.equal(await style(page, '#switch-on', '::before', 'opacity'), '1');
  } finally {
    await kit.close();
  }
});

// Safari and WebKit skip links and buttons on Tab by default; Option+Tab visits every focusable control
const TAB_KEY = process.env.FAM_BROWSER === 'webkit' ? 'Alt+Tab' : 'Tab';

const FOCUS_TARGETS = [
  'glass-input',
  'glass-select',
  'switch-off',
  'plastic-red',
  'leather-button',
  'recessed-input',
  'search-input',
  'nav-link',
  'row-plain',
];

// Runs in the page. Reports the focus indicator of a control and of the wrapper that draws it for hidden or borderless inputs.
const SNAPSHOT_SOURCE = `(id) => {
  const element = id === 'switch-off' ? document.querySelector('#switch-off input') : document.getElementById(id);
  const wrapper = element.closest('.fam-switch, .fam-glass, .fam-field') ?? element;
  const read = (node) => { const computed = getComputedStyle(node); return { outline: computed.outlineStyle + ' ' + computed.outlineWidth, shadow: computed.boxShadow }; };
  return { element: read(element), wrapper: read(wrapper) };
}`;

const drawsOutline = (snapshot) => snapshot.outline.startsWith('solid') && !snapshot.outline.endsWith(' 0px');

test('every interactive control shows a focus indicator', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    const snapshot = (id) => page.evaluate(`(${SNAPSHOT_SOURCE})(${JSON.stringify(id)})`);
    const unfocused = {};
    for (const id of FOCUS_TARGETS) unfocused[id] = await snapshot(id);

    const seen = new Set();
    for (let press = 0; press < 80 && seen.size < FOCUS_TARGETS.length; press += 1) {
      await page.keyboard.press(TAB_KEY);
      const focusedId = await page.evaluate(() => {
        const active = document.activeElement;
        return active.closest('#switch-off') ? 'switch-off' : active.id;
      });
      if (!FOCUS_TARGETS.includes(focusedId) || seen.has(focusedId)) continue;
      seen.add(focusedId);
      const focused = await snapshot(focusedId);
      const before = unfocused[focusedId];
      const indicated = ['element', 'wrapper'].some(
        (part) => drawsOutline(focused[part]) || focused[part].shadow !== before[part].shadow,
      );
      assert.ok(indicated, `${focusedId} shows no focus indicator: ${JSON.stringify({ before, focused })}`);
    }
    assert.deepEqual([...seen].sort(), [...FOCUS_TARGETS].sort(), 'not every control was reachable with Tab');
  } finally {
    await kit.close();
  }
});

test('candy cane stops under reduced motion', async () => {
  const reduced = await openUrl(fixtureUrl('kit'), { reducedMotion: 'reduce' });
  const normal = await openUrl(fixtureUrl('kit'), { reducedMotion: 'no-preference' });
  try {
    assert.equal(await style(reduced.page, '#candy', null, 'animationName'), 'none');
    assert.equal(await style(normal.page, '#candy', null, 'animationName'), 'fam-stripe');
  } finally {
    await reduced.close();
    await normal.close();
  }
});

test('long text stays inside its container', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    const overflow = await page.evaluate(() => {
      const long = 'W'.repeat(200);
      const results = {};
      const measure = (name, container) => {
        results[name] = container.scrollWidth - container.clientWidth;
      };

      const nav = document.getElementById('nav');
      nav.style.width = '260px';
      document.getElementById('nav-link').textContent = long;
      // A nav with more than fits may scroll inside itself, but it must not push its container wider
      measure('nav', nav.parentElement);

      const list = document.getElementById('row-plain').closest('ul');
      list.style.width = '260px';
      document.querySelector('#row-plain b').textContent = long;
      measure('list', list);

      const glass = document.getElementById('glass-input').parentElement;
      const field = glass.parentElement;
      field.style.width = '260px';
      document.getElementById('glass-input').value = long;
      measure('glass field', field);
      return results;
    });
    for (const [name, extra] of Object.entries(overflow)) {
      assert.ok(extra <= 0, `${name} overflows its container by ${extra}px`);
    }
    assert.equal(await style(page, '#row-plain b', null, 'textOverflow'), 'ellipsis');
    assert.equal(await style(page, '#nav-link', null, 'textOverflow'), 'ellipsis');
  } finally {
    await kit.close();
  }
});

test('glass glow does not widen the page', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const extra = await kit.page.evaluate(() => {
      const host = document.createElement('div');
      host.style.cssText = 'width:260px; overflow:visible';
      host.innerHTML = '<div class="fam-glass"><input class="fam-glass-input" aria-label="Edge"></div>';
      document.body.append(host);
      return host.scrollWidth - host.clientWidth;
    });
    assert.ok(extra <= 0, `the glow layer overflows its container by ${extra}px, which scrolls the page sideways at the viewport edge`);
  } finally {
    await kit.close();
  }
});

test('selected rows use the blue family and navigation does not', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    for (const selector of ['#row-selected', '#menu-selected']) {
      const background = await style(page, selector, null, 'backgroundImage');
      assert.ok(background.includes('rgb(64, 110, 218)') && background.includes('rgb(47, 95, 200)'), `${selector}: ${background}`);
    }
    const activeNav = await style(page, '#nav-current', null, 'backgroundImage');
    assert.ok(!activeNav.includes('rgb(64, 110, 218)'), activeNav);
    assert.equal(await style(page, '#nav-link', null, 'color'), 'rgb(28, 13, 3)');
  } finally {
    await kit.close();
  }
});

test('plastic colors and the amber dark label follow the spec', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    assert.equal(await customProperty(page, '#plastic-red', '--fam-c'), '#a82219');
    assert.equal(await customProperty(page, '#plastic-green', '--fam-c'), '#176528');
    assert.equal(await customProperty(page, '#plastic-blue', '--fam-c'), '#264eae');
    assert.equal(await customProperty(page, '#plastic-purple', '--fam-c'), '#53349e');
    assert.equal(await customProperty(page, '#plastic-amber', '--fam-c'), '#f2a62b');
    assert.equal(await style(page, '#plastic-amber', null, 'color'), 'rgb(42, 22, 0)');
    assert.equal(await style(page, '#plastic-red', null, 'color'), 'rgb(255, 255, 255)');
    assert.equal(await customProperty(page, '#knob', '--fam-knob-angle'), '35deg');
  } finally {
    await kit.close();
  }
});

test('dropdown is a glass field with a chevron and no button', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const background = await style(kit.page, '#glass-select', null, 'backgroundImage');
    assert.ok(background.includes('data:image/svg+xml'), background);
    assert.equal(await style(kit.page, '#glass-select', null, 'appearance'), 'none');
  } finally {
    await kit.close();
  }
});

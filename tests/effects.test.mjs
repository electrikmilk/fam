import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fixtureUrl, openUrl } from './helpers/browser.mjs';
import { parseBoxShadow, reachOf, totalAlphaOf } from './helpers/shadows.mjs';

const snippetUrl = new URL('../snippets/refraction-filter.html', import.meta.url);

async function openKit() {
  const snippet = await readFile(snippetUrl, 'utf8');
  const kit = await openUrl(fixtureUrl('kit'));
  await kit.page.evaluate((markup) => document.body.insertAdjacentHTML('afterbegin', markup), snippet);
  return kit;
}

const style = (page, selector, pseudo, property) =>
  page.evaluate(([target, pseudoElement, name]) => getComputedStyle(document.querySelector(target), pseudoElement)[name], [selector, pseudo, property]);

test('glass filter layer is rounded with a real border-radius', async () => {
  const kit = await openKit();
  try {
    assert.equal(await style(kit.page, '#glass', '::before', 'borderRadius'), await style(kit.page, '#glass', null, 'borderRadius'));
    assert.equal(await style(kit.page, '#glass', '::before', 'borderRadius'), '27px');
    assert.notEqual(await style(kit.page, '#glass', null, 'overflow'), 'hidden');
    assert.equal(await style(kit.page, '#glass', null, 'clipPath'), 'none');
  } finally {
    await kit.close();
  }
});

test('glass glow clip follows a fam-round radius class', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    assert.equal(await style(kit.page, '#glass-rounded', null, 'borderRadius'), '12px');
    assert.equal(await style(kit.page, '#glass-rounded', '::before', 'borderRadius'), '12px');
    assert.equal(await style(kit.page, '#glass-rounded', '::after', 'borderRadius'), '44px');
  } finally {
    await kit.close();
  }
});

test('glass recipe values', async () => {
  const kit = await openKit();
  try {
    const lens = await style(kit.page, '#glass', '::before', 'backdropFilter');
    assert.ok(lens.includes('blur(14px)') && lens.includes('saturate(1.25)') && lens.includes('brightness(1.1)'), lens);
    const glow = await style(kit.page, '#glass', '::after', 'backdropFilter');
    assert.ok(glow.includes('blur(25px)') && glow.includes('brightness(1.5)') && glow.includes('saturate(2.6)'), glow);
    const shade = await style(kit.page, '#glass', '::before', 'backgroundImage');
    assert.ok(shade.includes('rgba(0, 0, 0, 0.42)'), shade);
  } finally {
    await kit.close();
  }
});

test('glass saturation is a variable', async () => {
  const kit = await openKit();
  try {
    const lens = await style(kit.page, '#glass-saturated', '::before', 'backdropFilter');
    assert.ok(lens.includes('saturate(2)'), lens);
  } finally {
    await kit.close();
  }
});

test('glass blur is a variable', async () => {
  const kit = await openKit();
  try {
    assert.ok((await style(kit.page, '#glass-blurred', '::before', 'backdropFilter')).includes('blur(20px)'));
    assert.ok((await style(kit.page, '#glass', '::before', 'backdropFilter')).includes('blur(14px)'));
  } finally {
    await kit.close();
  }
});

test('refraction blur is a variable', async () => {
  const kit = await openKit();
  try {
    assert.ok((await style(kit.page, '#refract-blurred', '::before', 'backdropFilter')).includes('blur(6px)'));
    assert.ok((await style(kit.page, '#glass-refract', '::before', 'backdropFilter')).includes('blur(1px)'));
  } finally {
    await kit.close();
  }
});

test('refraction modifier uses the filter', async () => {
  const kit = await openKit();
  try {
    const lens = await style(kit.page, '#glass-refract', '::before', 'backdropFilter');
    assert.ok(lens.includes('url(') && lens.includes('fam-refract'), lens);
  } finally {
    await kit.close();
  }
});

test('refraction snippet is static', async () => {
  const snippet = await readFile(snippetUrl, 'utf8');
  assert.ok(snippet.includes('data:image/svg+xml'));
  assert.ok(snippet.includes('id="fam-refract"'));
  assert.ok(!snippet.includes('<script'));
});

test('engraved text colors', async () => {
  const kit = await openKit();
  try {
    assert.equal(await style(kit.page, '#engraved-metal', null, 'color'), 'rgb(18, 20, 26)');
    assert.equal(await style(kit.page, '#engraved-wood', null, 'color'), 'rgb(66, 38, 14)');
    assert.equal(await style(kit.page, '#engraved-leather', null, 'color'), 'rgb(55, 28, 10)');
  } finally {
    await kit.close();
  }
});

test('concentric radius is the outer radius minus the padding', async () => {
  const kit = await openKit();
  try {
    assert.equal(await style(kit.page, '#concentric', null, 'borderRadius'), '18px');
  } finally {
    await kit.close();
  }
});

test('shadow utilities differ', async () => {
  const kit = await openKit();
  try {
    const shadows = await Promise.all(['sm', 'md', 'lg', 'inset'].map((size) => style(kit.page, `#shadow-${size}`, null, 'boxShadow')));
    assert.ok(shadows.every((shadow) => shadow !== 'none'));
    assert.equal(new Set(shadows).size, 4);
  } finally {
    await kit.close();
  }
});

// Reach and total alpha of the elevation shadows before they became contact-hardening: the new ones must stay casual
const ORIGINAL_ELEVATION = { sm: { reach: 4, alpha: 0.4 }, md: { reach: 18, alpha: 0.56 }, lg: { reach: 52, alpha: 0.82 } };
const ELEVATION_LAYER_COUNTS = { sm: 3, md: 5, lg: 6 };

test('elevation shadows are no longer or darker than the originals', async () => {
  const kit = await openKit();
  try {
    for (const size of ['sm', 'md', 'lg']) {
      const layers = parseBoxShadow(await style(kit.page, `#shadow-${size}`, null, 'boxShadow'));
      assert.equal(layers.length, ELEVATION_LAYER_COUNTS[size], `shadow-${size} layer count`);
      assert.ok(reachOf(layers) <= ORIGINAL_ELEVATION[size].reach + 2, `shadow-${size} reaches ${reachOf(layers)}px`);
      assert.ok(totalAlphaOf(layers) <= ORIGINAL_ELEVATION[size].alpha + 0.005, `shadow-${size} total alpha is ${totalAlphaOf(layers)}`);
    }
  } finally {
    await kit.close();
  }
});

const CAST_SIZES = { sm: { reach: 50, alpha: 1.4 }, md: { reach: 88, alpha: 1.85 }, lg: { reach: 126, alpha: 2.55 } };

test('cast shadows get longer and darker with size', async () => {
  const kit = await openKit();
  try {
    const measured = [];
    for (const [size, expected] of Object.entries(CAST_SIZES)) {
      const layers = parseBoxShadow(await style(kit.page, `#cast-${size}`, null, 'boxShadow'));
      assert.equal(reachOf(layers), expected.reach, `cast-${size} reach`);
      assert.ok(Math.abs(totalAlphaOf(layers) - expected.alpha) < 0.005, `cast-${size} total alpha is ${totalAlphaOf(layers)}`);
      measured.push({ reach: reachOf(layers), alpha: totalAlphaOf(layers) });
    }
    assert.ok(measured[0].reach < measured[1].reach && measured[1].reach < measured[2].reach, 'reach grows with size');
    assert.ok(measured[0].alpha < measured[1].alpha && measured[1].alpha < measured[2].alpha, 'total alpha grows with size');
  } finally {
    await kit.close();
  }
});

test('a plastic button inside a cast wrapper keeps its own shadow', async () => {
  const kit = await openKit();
  try {
    assert.notEqual(await style(kit.page, '#cast-wrapper', null, 'boxShadow'), 'none');
    const withCast = await style(kit.page, '#cast-inner', null, 'boxShadow');
    await kit.page.evaluate(() => document.querySelector('#cast-wrapper').classList.remove('fam-cast-md'));
    assert.equal(await style(kit.page, '#cast-inner', null, 'boxShadow'), withCast);
  } finally {
    await kit.close();
  }
});

test('gloss strength is a variable on the pill', async () => {
  const kit = await openKit();
  try {
    const read = (id) => kit.page.evaluate((target) => getComputedStyle(document.getElementById(target)).getPropertyValue('--fam-gloss').trim(), id);
    assert.equal(await read('pill-none'), '0');
    assert.equal(await read('pill-soft'), '.28');
    assert.equal(await read('pill-strong'), '.55');
  } finally {
    await kit.close();
  }
});

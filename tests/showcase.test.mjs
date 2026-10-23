import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';
import { openUrl, showcaseUrl } from './helpers/browser.mjs';
import { OFFENDERS_SOURCE } from './helpers/layout.mjs';

const IMAGE_BUDGET_BYTES = 300 * 1024;
const TOTAL_IMAGE_BUDGET_BYTES = 3 * 1024 * 1024;

test('showcase loads cleanly within the image budget', async () => {
  const page = await openUrl(showcaseUrl);
  try {
    assert.deepEqual(page.issues, []);
    for (const name of ['ribbon.jpg', 'tree.jpg']) {
      const { size } = await stat(new URL(`../showcase/images/${name}`, import.meta.url));
      assert.ok(size <= IMAGE_BUDGET_BYTES, `${name} is ${size} bytes`);
    }
    const bytes = await page.imageBytes();
    assert.ok(bytes <= TOTAL_IMAGE_BUDGET_BYTES, `the page loads ${bytes} bytes of images`);
  } finally {
    await page.close();
  }
});

test('opening screen is tan stitched leather with serif engraved text', async () => {
  const page = await openUrl(showcaseUrl);
  try {
    const read = (selector, property) => page.page.evaluate(([target, name]) => getComputedStyle(document.querySelector(target))[name], [selector, property]);
    assert.equal(await page.page.textContent('#hero h1'), 'Fam');
    assert.equal(await page.page.textContent('#hero .tagline'), 'Familiar materials for the web');
    assert.ok((await read('#hero h1', 'fontFamily')).startsWith('Georgia'));
    assert.ok((await read('#hero .tagline', 'fontFamily')).startsWith('Georgia'));
    assert.ok((await read('#hero', 'borderImageSource')).includes('leather-frame-tan-soft.png'));
  } finally {
    await page.close();
  }
});

test('credits name both photographers and link the credits file', async () => {
  const page = await openUrl(showcaseUrl);
  try {
    const { text, links } = await page.page.evaluate(() => ({
      text: document.querySelector('#credits').textContent,
      links: [...document.querySelectorAll('#credits a')].map((link) => link.href),
    }));
    assert.ok(text.includes('boliviainteligente') && text.includes('mehrab-sium'), text);
    assert.ok(links.some((href) => href.endsWith('CREDITS.md')), links.join(', '));
  } finally {
    await page.close();
  }
});

test('page copy has no em dashes', async () => {
  const page = await openUrl(showcaseUrl);
  try {
    assert.ok(!(await page.page.evaluate(() => document.body.textContent)).includes('—'));
  } finally {
    await page.close();
  }
});

test('showcase carries the current refraction snippet', async () => {
  const [page, snippet] = await Promise.all([
    readFile(new URL('../showcase/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../snippets/refraction-filter.html', import.meta.url), 'utf8'),
  ]);
  assert.ok(page.includes(snippet.trim()), 'showcase/index.html has a stale or missing copy of snippets/refraction-filter.html');
});

test('showcase has no horizontal scroll at phone width', async () => {
  const page = await openUrl(showcaseUrl, { viewport: { width: 375, height: 800 } });
  try {
    const { scrollWidth, innerWidth } = await page.page.evaluate(() => ({ scrollWidth: document.scrollingElement.scrollWidth, innerWidth: window.innerWidth }));
    assert.ok(scrollWidth <= innerWidth, `the page scrolls sideways: ${scrollWidth}px in a ${innerWidth}px viewport`);
    assert.deepEqual(await page.page.evaluate(`(${OFFENDERS_SOURCE})()`), []);
  } finally {
    await page.close();
  }
});

const SCENES = ['scene-wood-felt', 'scene-legal-leather', 'scene-leather-paper', 'scene-metal', 'scene-frames', 'scene-engraved'];

test('showcase has the paired scenes in order', async () => {
  const page = await openUrl(showcaseUrl);
  try {
    const ids = await page.page.$$eval('section.scene', (sections) => sections.map((section) => section.id));
    assert.deepEqual(ids.slice(0, SCENES.length), SCENES);
  } finally {
    await page.close();
  }
});

// The page may only claim what the package does: every class a caption names must be defined in the real stylesheet
test('every class in a caption exists in the kit', async () => {
  const [css, page] = await Promise.all([readFile(new URL('../dist/fam-ui.css', import.meta.url), 'utf8'), openUrl(showcaseUrl)]);
  try {
    const names = await page.page.$$eval('.cap code', (codes) => [...new Set(codes.flatMap((code) => code.textContent.match(/(?<![-\w])fam-[a-z0-9-]+/g) ?? []))]);
    assert.ok(names.length >= 25, `only ${names.length} classes are named in captions`);
    for (const name of names) assert.ok(css.includes(`.${name}`), `a caption names .${name} but the stylesheet does not define it`);
  } finally {
    await page.close();
  }
});

test('captions match the markup of their scene', async () => {
  const page = await openUrl(showcaseUrl);
  try {
    assert.ok((await page.page.$$('section.scene')).length >= SCENES.length, 'the scenes are missing');
    const missing = await page.page.evaluate(() =>
      [...document.querySelectorAll('section.scene')].flatMap((scene) =>
        (scene.querySelector('.cap code')?.textContent.match(/(?<![-\w])fam-[a-z0-9-]+/g) ?? [])
          .filter((name) => !scene.querySelector(`:not(.cap) .${name}, .window.${name}`))
          .map((name) => `${scene.id}: ${name}`),
      ),
    );
    assert.deepEqual(missing, []);
  } finally {
    await page.close();
  }
});

test('scenes are framed windows with real content and work with JavaScript off', async () => {
  const page = await openUrl(showcaseUrl, { javaScriptEnabled: false });
  try {
    const scenes = await page.page.$$eval('section.scene', (sections) =>
      sections.map((section) => ({
        id: section.id,
        height: section.getBoundingClientRect().height,
        captionVisible: section.querySelector('.cap code').getBoundingClientRect().height > 0,
        windows: [...section.querySelectorAll('.window')].map((window) => getComputedStyle(window).boxShadow !== 'none'),
      })),
    );
    assert.ok(scenes.length >= SCENES.length, 'the scenes are missing');
    for (const scene of scenes) {
      assert.ok(scene.height > 100, `${scene.id} is empty`);
      assert.ok(scene.captionVisible, `${scene.id} has no visible caption`);
      assert.ok(scene.windows.length > 0 && scene.windows.every(Boolean), `${scene.id} has an unframed window`);
    }
  } finally {
    await page.close();
  }
});

test('build your own comes after the paired scenes', async () => {
  const page = await openUrl(showcaseUrl);
  try {
    const ids = await page.page.$$eval('section.scene', (sections) => sections.map((section) => section.id));
    assert.equal(ids[SCENES.length], 'scene-build');
  } finally {
    await page.close();
  }
});

test('build your own shows every texture, labeled with the classes it uses', async () => {
  const page = await openUrl(showcaseUrl);
  try {
    const squares = await page.page.$$eval('#scene-build .swatches .sq', (figures) =>
      figures.map((figure) => ({
        classes: [...figure.querySelector('.swatch').classList],
        properties: [...figure.querySelector('.swatch').style].filter((name) => name.startsWith('--')),
        label: figure.querySelector('figcaption').textContent.trim(),
      })),
    );
    assert.equal(squares.length, 10);
    for (const square of squares) {
      for (const token of square.label.split(/\s+/)) {
        if (token.startsWith('--fam-')) assert.ok(square.properties.includes(token), `${token} is labeled but not set on its square`);
        else assert.ok(square.classes.includes(token), `${token} is labeled but not on its square (${square.classes.join(' ')})`);
      }
    }
    const textures = ['fam-felt', 'fam-wood', 'fam-metal', 'fam-leather', 'fam-paper', 'fam-cork', 'fam-cardstock', 'fam-legal-pad', 'fam-leather-frame'];
    const shown = new Set(squares.flatMap((square) => square.classes));
    for (const texture of textures) assert.ok(shown.has(texture), `${texture} has no square`);
    assert.ok(squares.some((square) => square.properties.includes('--fam-cardstock-tint')), 'tinted cardstock has no square');
  } finally {
    await page.close();
  }
});

test('build your own shows felt in five colors', async () => {
  const page = await openUrl(showcaseUrl);
  try {
    const colors = await page.page.$$eval('#scene-build .tint', (tints) => tints.map((tint) => getComputedStyle(tint).backgroundColor));
    assert.equal(colors.length, 5);
    assert.equal(new Set(colors).size, 5);
  } finally {
    await page.close();
  }
});

test('build your own shows gloss, rounding and shadow utilities', async () => {
  const page = await openUrl(showcaseUrl);
  try {
    const found = await page.page.evaluate(() => {
      const scene = document.querySelector('#scene-build');
      const has = (names) => names.map((name) => Boolean(scene.querySelector(`.${name}`)));
      return {
        gloss: has(['fam-gloss-none', 'fam-gloss-soft', 'fam-gloss-strong']),
        rounding: has(['fam-round-sm', 'fam-round-md', 'fam-round-lg', 'fam-round-pill']),
        shadows: ['sm', 'md', 'lg', 'inset'].map((size) => getComputedStyle(scene.querySelector(`.fam-shadow-${size}`)).boxShadow),
      };
    });
    assert.ok(found.gloss.every(Boolean) && found.rounding.every(Boolean));
    assert.ok(found.shadows.every((shadow) => shadow !== 'none'));
    assert.equal(new Set(found.shadows).size, 4);
  } finally {
    await page.close();
  }
});

// A page stub for navigator.clipboard that records what the page asks to copy
const RECORDING_CLIPBOARD = `window.__copied = []; Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (text) => { window.__copied.push(text); } } });`;
const REJECTING_CLIPBOARD = `Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('denied'); } } });`;
const NO_CLIPBOARD = `Object.defineProperty(navigator, 'clipboard', { value: undefined });`;

test('every caption gets a copy button that copies its classes', async () => {
  const page = await openUrl(showcaseUrl, { initScript: RECORDING_CLIPBOARD });
  try {
    const counts = await page.page.evaluate(() => ({ codes: document.querySelectorAll('code.copyable').length, buttons: document.querySelectorAll('code.copyable + button.copy').length }));
    assert.ok(counts.codes >= 7, 'the captions are missing');
    assert.equal(counts.buttons, counts.codes);

    const first = page.page.locator('#scene-wood-felt .copy');
    assert.ok((await first.getAttribute('aria-label')).includes('wood + felt'), 'the button does not say what it copies');
    await first.click();
    const expected = await page.page.textContent('#scene-wood-felt code');
    assert.deepEqual(await page.page.evaluate(() => window.__copied), [expected]);
    assert.equal(await first.textContent(), 'Copied');
    assert.ok((await page.page.textContent('[role="status"]')).includes('Copied'));
    await page.page.waitForFunction(() => document.querySelector('#scene-wood-felt .copy').textContent === 'Copy', null, { timeout: 4000 });
  } finally {
    await page.close();
  }
});

test('a refused copy says so', async () => {
  const page = await openUrl(showcaseUrl, { initScript: REJECTING_CLIPBOARD });
  try {
    const button = page.page.locator('#scene-wood-felt .copy');
    await button.click();
    await page.page.waitForFunction(() => document.querySelector('#scene-wood-felt .copy').textContent === 'Copy failed');
    assert.ok((await page.page.textContent('[role="status"]')).includes('Copy failed'));
  } finally {
    await page.close();
  }
});

test('no copy buttons appear without the clipboard API', async () => {
  const page = await openUrl(showcaseUrl, { initScript: NO_CLIPBOARD });
  try {
    assert.equal(await page.page.locator('.copy').count(), 0);
  } finally {
    await page.close();
  }
});

// The opening screen stops short of the bottom, so the top of the first scene shows and scrolling is obvious without a "Scroll" cue
for (const [width, height] of [[1440, 900], [768, 1024], [375, 700]]) {
  test(`the next section peeks into the first screen at ${width} by ${height}`, async () => {
    const page = await openUrl(showcaseUrl, { viewport: { width, height } });
    try {
      const { heroBottom, windowTop, cues } = await page.page.evaluate(() => ({
        heroBottom: document.querySelector('#hero').getBoundingClientRect().bottom,
        windowTop: document.querySelector('#scene-wood-felt .window').getBoundingClientRect().top,
        cues: document.querySelectorAll('.scroll-cue').length,
      }));
      assert.ok(heroBottom < height - 60, `the opening screen ends at ${heroBottom}px of a ${height}px viewport`);
      assert.ok(windowTop < height - 60, `the first scene starts at ${windowTop}px, below the fold of a ${height}px viewport`);
      assert.equal(cues, 0, 'the scroll cue is still on the page');
    } finally {
      await page.close();
    }
  });
}

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
    const names = await page.page.$$eval('.cap code', (codes) => [...new Set(codes.flatMap((code) => code.textContent.match(/fam-[a-z0-9-]+/g) ?? []))]);
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
        (scene.querySelector('.cap code')?.textContent.match(/fam-[a-z0-9-]+/g) ?? [])
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

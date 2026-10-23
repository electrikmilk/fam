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

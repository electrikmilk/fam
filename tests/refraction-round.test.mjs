import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fixtureUrl, openUrl } from './helpers/browser.mjs';

const helperUrl = new URL('../snippets/refraction-round.js', import.meta.url);
const GLASS = '#glass-refract';

async function openKitWithHelper() {
  const kit = await openUrl(fixtureUrl('kit'));
  await kit.page.addScriptTag({ content: await readFile(helperUrl, 'utf8') });
  await kit.page.waitForFunction((selector) => document.querySelector(selector).style.getPropertyValue('--fam-refract-filter') !== '', GLASS);
  return kit;
}

// The red and green levels of the displacement map the helper built for an element, at a point given in the element's own pixels
const mapLevels = (page, x, y) =>
  page.evaluate(
    async ([selector, pointX, pointY]) => {
      const element = document.querySelector(selector);
      const id = element.style.getPropertyValue('--fam-refract-filter').slice('url(#'.length, -1);
      const image = new Image();
      image.src = document.getElementById(id).querySelector('feImage').getAttribute('href');
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      const column = Math.floor((pointX / element.offsetWidth) * image.width);
      const row = Math.floor((pointY / element.offsetHeight) * image.height);
      const [red, green] = context.getImageData(column, row, 1, 1).data;
      return [red, green];
    },
    [GLASS, x, y],
  );

test('refracting glass gets a filter of its own once the helper runs', async () => {
  const kit = await openKitWithHelper();
  try {
    const reference = await kit.page.evaluate((selector) => document.querySelector(selector).style.getPropertyValue('--fam-refract-filter'), GLASS);
    assert.match(reference, /^url\(#fam-refract-\d+\)$/);
    const lens = await kit.page.evaluate((selector) => getComputedStyle(document.querySelector(selector), '::before').backdropFilter, GLASS);
    assert.ok(lens.includes(reference.slice('url('.length, -1)), lens);
    assert.ok(lens.includes('blur('), lens);
  } finally {
    await kit.close();
  }
});

test('the pull follows the rounded rim and is neutral in the middle', async () => {
  const kit = await openKitWithHelper();
  try {
    // The fixture glass is 210 by 54 with a 27px radius, so each end is a half circle
    const [topLeftRed, topLeftGreen] = await mapLevels(kit.page, 8, 8);
    assert.ok(topLeftRed > 140 && topLeftGreen > 140, `top left arc pulls down and right, got ${topLeftRed},${topLeftGreen}`);
    const [bottomRightRed, bottomRightGreen] = await mapLevels(kit.page, 202, 46);
    assert.ok(bottomRightRed < 116 && bottomRightGreen < 116, `bottom right arc pulls up and left, got ${bottomRightRed},${bottomRightGreen}`);
    const [topRed, topGreen] = await mapLevels(kit.page, 105, 1);
    assert.ok(Math.abs(topRed - 128) <= 1 && topGreen > 140, `top edge pulls straight down, got ${topRed},${topGreen}`);
    const [centerRed, centerGreen] = await mapLevels(kit.page, 105, 27);
    assert.deepEqual([centerRed, centerGreen], [128, 128]);
  } finally {
    await kit.close();
  }
});

test('the filter is rebuilt when the radius changes', async () => {
  const kit = await openKitWithHelper();
  try {
    const { page } = kit;
    const href = () => page.evaluate((selector) => {
      const id = document.querySelector(selector).style.getPropertyValue('--fam-refract-filter').slice('url(#'.length, -1);
      return document.getElementById(id).querySelector('feImage').getAttribute('href');
    }, GLASS);
    const rounded = await href();
    await page.evaluate((selector) => document.querySelector(selector).style.setProperty('--fam-r', '0px'), GLASS);
    await page.waitForFunction(([selector, before]) => {
      const id = document.querySelector(selector).style.getPropertyValue('--fam-refract-filter').slice('url(#'.length, -1);
      return document.getElementById(id).querySelector('feImage').getAttribute('href') !== before;
    }, [GLASS, rounded]);
    const [squareRed, squareGreen] = await mapLevels(page, 8, 8);
    assert.ok(Math.abs(squareRed - 128) <= 1 && squareGreen > 140, `a square corner pulls straight down, got ${squareRed},${squareGreen}`);
  } finally {
    await kit.close();
  }
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fixtureUrl, openUrl } from './helpers/browser.mjs';

const helperUrl = new URL('../snippets/refraction.js', import.meta.url);
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

// The scales of the red, green and blue displacement passes of the filter the helper built for an element
const channelScales = (page) =>
  page.evaluate((selector) => {
    const id = document.querySelector(selector).style.getPropertyValue('--fam-refract-filter').slice('url(#'.length, -1);
    return [...document.getElementById(id).querySelectorAll('feDisplacementMap')].map((pass) => Number(pass.getAttribute('scale')));
  }, GLASS);

const setGlassVariable = (page, name, value) =>
  page.evaluate(([selector, variable, text]) => document.querySelector(selector).style.setProperty(variable, text), [GLASS, name, value]);

const waitForScales = (page, expected) =>
  page.waitForFunction(
    ([selector, wanted]) => {
      const id = document.querySelector(selector).style.getPropertyValue('--fam-refract-filter').slice('url(#'.length, -1);
      const scales = [...document.getElementById(id).querySelectorAll('feDisplacementMap')].map((pass) => Number(pass.getAttribute('scale')));
      return scales.every((scale, index) => Math.abs(scale - wanted[index]) < 0.00001);
    },
    [GLASS, expected],
  );

test('red bends furthest and blue least by default, so the rim fringes', async () => {
  const kit = await openKitWithHelper();
  try {
    assert.deepEqual(await channelScales(kit.page), [0.22, 0.2, 0.18]);
  } finally {
    await kit.close();
  }
});

test('the amount scales every pass and the dispersion spreads red and blue around green', async () => {
  const kit = await openKitWithHelper();
  try {
    const { page } = kit;
    await setGlassVariable(page, '--fam-refract-amount', '2');
    await waitForScales(page, [0.44, 0.4, 0.36]);
    await setGlassVariable(page, '--fam-refract-dispersion', '0');
    await waitForScales(page, [0.4, 0.4, 0.4]);
    await setGlassVariable(page, '--fam-refract-amount', '0');
    await waitForScales(page, [0, 0, 0]);
  } finally {
    await kit.close();
  }
});

test('a variable that is not a plain number raises instead of falling back', async () => {
  const kit = await openKitWithHelper();
  try {
    const { page } = kit;
    const raised = new Promise((resolve) => page.once('pageerror', resolve));
    await setGlassVariable(page, '--fam-refract-amount', '2px');
    assert.match((await raised).message, /--fam-refract-amount must be a plain number, got "2px"/);
  } finally {
    await kit.close();
  }
});

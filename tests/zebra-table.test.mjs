import assert from 'node:assert/strict';
import test from 'node:test';
import { fixtureUrl, isChromium, openUrl } from './helpers/browser.mjs';
import { statistics } from './helpers/pixels.mjs';

const read = (page, selector, expression) => page.evaluate(([target, source]) => new Function('element', `return ${source}`)(document.querySelector(target)), [selector, expression]);

// Mean brightness of a small strip in the padding at the left edge of one row, where a cell has no text or divider.
// `row` counts the rows showing in the box from its top, where the header is row 0.
async function rowBrightness(page, boxSelector, row, rowHeight) {
  const { x, y } = await page.evaluate((target) => {
    const element = document.querySelector(target);
    const rect = element.getBoundingClientRect();
    return { x: rect.left + window.scrollX + element.clientLeft, y: rect.top + window.scrollY + element.clientTop };
  }, boxSelector);
  const clip = { x: x + 3, y: y + row * rowHeight + rowHeight / 2 - 6, width: 4, height: 12 };
  const { mean } = statistics(await page.screenshot({ clip, fullPage: true }));
  return (mean[0] + mean[1] + mean[2]) / 3;
}

// A stripe tints the material toward the ink by about 9%, which is about 17 levels on white paper
const STRIPE_DIFFERENCE = 8;
const SAME_ROW_TOLERANCE = 5;

function assertAlternating(brightnessOfRows, label) {
  brightnessOfRows.forEach((brightness, index) => {
    if (index === 0) return;
    assert.ok(Math.abs(brightness - brightnessOfRows[index - 1]) > STRIPE_DIFFERENCE, `${label}: rows ${index - 1} and ${index} do not differ (${brightnessOfRows.join(', ')})`);
    if (index < 2) return;
    assert.ok(Math.abs(brightness - brightnessOfRows[index - 2]) < SAME_ROW_TOLERANCE, `${label}: rows ${index - 2} and ${index} do not match (${brightnessOfRows.join(', ')})`);
  });
}

test('the box is the header plus --fam-table-rows rows tall', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    assert.equal(await read(kit.page, '#zebra-box', 'element.clientHeight'), 7 * 24);
    assert.equal(await read(kit.page, '#zebra-tall', 'element.clientHeight'), 9 * 40, 'the default is eight rows, and the row height variable is used');
  } finally {
    await kit.close();
  }
});

test('every row and the header are exactly one row height', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const heights = (selector) => kit.page.evaluate((target) => [...document.querySelectorAll(target)].map((row) => row.getBoundingClientRect().height), selector);
    assert.deepEqual([...new Set(await heights('#zebra-box tr'))], [24]);
    assert.deepEqual([...new Set(await heights('#zebra-tall tr'))], [40]);
    assert.deepEqual([...new Set(await heights('#zebra-long tr'))], [24], 'long text made a row taller');
    assert.equal(await read(kit.page, '#zebra-long td', 'getComputedStyle(element).textOverflow'), 'ellipsis');
  } finally {
    await kit.close();
  }
});

test('the header stays put while the rows scroll', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    assert.ok(await read(kit.page, '#zebra-box', 'element.scrollHeight > element.clientHeight'), 'the rows do not overflow the box');
    await kit.page.evaluate(() => { document.querySelector('#zebra-box').scrollTop = 72; });
    const { headerTop, contentTop } = await kit.page.evaluate(() => {
      const box = document.querySelector('#zebra-box');
      return { headerTop: box.querySelector('th').getBoundingClientRect().top, contentTop: box.getBoundingClientRect().top + box.clientTop };
    });
    assert.equal(headerTop, contentTop);
  } finally {
    await kit.close();
  }
});

test('stripes alternate from the first row down through the empty placeholder rows', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const brightness = [];
    for (let row = 1; row <= 6; row += 1) brightness.push(await rowBrightness(kit.page, '#zebra-empty', row, 24));
    assertAlternating(brightness, 'empty table');
    assert.ok(brightness[0] > brightness[1], 'the first row should be the unstriped one');
  } finally {
    await kit.close();
  }
});

test('placeholder stripes continue the pattern of the real rows', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const long = [];
    for (let row = 1; row <= 3; row += 1) long.push(await rowBrightness(kit.page, '#zebra-long', row, 24));
    assertAlternating(long, 'two real rows then one placeholder');

    const tall = [];
    for (let row = 1; row <= 4; row += 1) tall.push(await rowBrightness(kit.page, '#zebra-tall', row, 40));
    assertAlternating(tall, 'rows 40px high');

    await kit.page.evaluate(() => { const box = document.querySelector('#zebra-box'); box.scrollTop = box.scrollHeight - box.clientHeight; });
    const scrolled = [];
    for (let row = 1; row <= 6; row += 1) scrolled.push(await rowBrightness(kit.page, '#zebra-box', row, 24));
    assertAlternating(scrolled, 'scrolled to the bottom');
  } finally {
    await kit.close();
  }
});

test('an empty table still shows stripes below its header', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    assert.equal(await read(kit.page, '#zebra-empty', 'element.clientHeight'), 7 * 24);
    assert.ok(await read(kit.page, '#zebra-empty th', 'element.getBoundingClientRect().height') === 24, 'the header is missing');
  } finally {
    await kit.close();
  }
});

test('a wide table scrolls inside its box on a phone', async () => {
  const kit = await openUrl(fixtureUrl('kit'), { viewport: { width: 375, height: 800 } });
  try {
    const { page } = kit;
    assert.ok(await read(page, '#zebra-wide', 'element.scrollWidth > element.clientWidth'), 'the box does not scroll sideways');
    assert.ok(await read(page, '#zebra-wide', 'element.getBoundingClientRect().right <= 375'), 'the box pushes past the screen');
    assert.ok(await read(page, '#zebra', 'element.scrollWidth <= element.clientWidth'), 'the table widened its section');
    await page.evaluate(() => { document.querySelector('#zebra-wide').scrollLeft = 100; });
    const { scrollLeft, headerTop, contentTop } = await page.evaluate(() => {
      const box = document.querySelector('#zebra-wide');
      return { scrollLeft: box.scrollLeft, headerTop: box.querySelector('th').getBoundingClientRect().top, contentTop: box.getBoundingClientRect().top + box.clientTop };
    });
    assert.equal(scrollLeft, 100);
    assert.equal(headerTop, contentTop);
  } finally {
    await kit.close();
  }
});

const meanChannel = (color) => color.match(/\d+/g).slice(0, 3).reduce((sum, channel) => sum + Number(channel), 0) / 3;

test('light ink gives light text and a dark header, and dark ink the reverse', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const colors = (selector) => kit.page.evaluate((target) => getComputedStyle(document.querySelector(target)).color, selector);
    const background = (selector) => kit.page.evaluate((target) => getComputedStyle(document.querySelector(target)).backgroundColor, selector);
    assert.ok(meanChannel(await colors('#zebra-light td')) > 200, 'light ink text is not light');
    assert.ok(meanChannel(await background('#zebra-light th')) < 80, 'light ink header is not dark');
    assert.ok(meanChannel(await colors('#zebra-box td')) < 80, 'dark ink text is not dark');
    assert.ok(meanChannel(await background('#zebra-box th')) > 200, 'dark ink header is not light');
  } finally {
    await kit.close();
  }
});

test('light ink stripes are a light tint, so they lighten the material instead of darkening it', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const brightness = [];
    for (let row = 1; row <= 4; row += 1) brightness.push(await rowBrightness(kit.page, '#zebra-light', row, 24));
    assert.ok(brightness[1] > brightness[0] + 4, `the striped row is not lighter (${brightness.join(', ')})`);
    assert.ok(brightness[3] > brightness[2] + 4, `the second striped row is not lighter (${brightness.join(', ')})`);
  } finally {
    await kit.close();
  }
});

test('a selected row is blue and an unselected one is not', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const image = (selector) => kit.page.evaluate((target) => getComputedStyle(document.querySelector(target)).backgroundImage, selector);
    assert.match(await image('#zebra-grid-selected td'), /gradient/);
    assert.equal(await image('#zebra-grid-plain td'), 'none');
    assert.equal(await kit.page.evaluate(() => getComputedStyle(document.querySelector('#zebra-grid-selected td')).color), 'rgb(255, 255, 255)');
  } finally {
    await kit.close();
  }
});

test('the selected row and the box stay visible in forced colors', { skip: !isChromium && 'forced-colors emulation is only reliable in Chromium' }, async () => {
  const kit = await openUrl(fixtureUrl('kit'), { forcedColors: 'active' });
  try {
    const style = (selector, property) => kit.page.evaluate(([target, name]) => getComputedStyle(document.querySelector(target))[name], [selector, property]);
    assert.notEqual(await style('#zebra-grid-selected td', 'backgroundColor'), await style('#zebra-grid-plain td', 'backgroundColor'), 'the selected row looks like the rest');
    assert.notEqual(await style('#zebra-box', 'borderTopStyle'), 'none', 'the box has no border');
    assert.notEqual(await style('#zebra-box th', 'borderBottomStyle'), 'none', 'the header has no rule');
  } finally {
    await kit.close();
  }
});

test('a row header is a plain cell, not a second sticky header', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const style = (selector, property) => kit.page.evaluate(([target, name]) => getComputedStyle(document.querySelector(target))[name], [selector, property]);
    assert.equal(await style('#zebra-rowheads thead th', 'position'), 'sticky');
    assert.equal(await style('#zebra-rowheads tbody th', 'position'), 'static', 'a row header sticks to the top of the box');
    assert.equal(await style('#zebra-rowheads tbody th', 'backgroundColor'), 'rgba(0, 0, 0, 0)', 'a row header is painted like the header band');
    assert.equal(await style('#zebra-rowheads tbody td', 'borderLeftStyle'), 'solid', 'no divider after a row header');
    assert.match(await style('#zebra-rowheads-selected th', 'backgroundImage'), /gradient/, 'a selected row leaves its row header unselected');
    assert.equal(await style('#zebra-rowheads-selected th', 'color'), 'rgb(255, 255, 255)');
  } finally {
    await kit.close();
  }
});

test('a caption does not shift the stripes away from the rows', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { headerTop, contentTop } = await kit.page.evaluate(() => {
      const box = document.querySelector('#zebra-caption');
      return { headerTop: box.querySelector('th').getBoundingClientRect().top, contentTop: box.getBoundingClientRect().top + box.clientTop };
    });
    assert.equal(headerTop, contentTop, 'the caption pushes the header down');
    const brightness = [];
    for (let row = 1; row <= 3; row += 1) brightness.push(await rowBrightness(kit.page, '#zebra-caption', row, 24));
    assertAlternating(brightness, 'a table with a caption');
  } finally {
    await kit.close();
  }
});

test('the focus ring on a row is light on a light ink table and dark on a dark ink one', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    const ringColor = async (selector) => {
      await page.locator(selector).focus();
      return page.evaluate((target) => getComputedStyle(document.querySelector(target)).outlineColor, selector);
    };
    assert.ok(meanChannel(await ringColor('#zebra-light-grid-plain')) > 200, 'the ring on brown cardstock is not light');
    assert.ok(meanChannel(await ringColor('#zebra-grid-plain')) < 80, 'the ring on paper is not dark');
  } finally {
    await kit.close();
  }
});

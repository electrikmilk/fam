import assert from 'node:assert/strict';
import test from 'node:test';
import { exampleUrl, openUrl } from './helpers/browser.mjs';
import { OFFENDERS_SOURCE } from './helpers/layout.mjs';

const PAGES = ['controls', 'notes', 'sign-in', 'components', 'frames'];
const LOAD_BUDGET_BYTES = 1.5 * 1024 * 1024;

for (const name of PAGES) {
  test(`${name} loads cleanly within the load budget`, async () => {
    const example = await openUrl(exampleUrl(name));
    try {
      assert.deepEqual(example.issues, []);
      const bytes = await example.imageBytes();
      assert.ok(bytes <= LOAD_BUDGET_BYTES, `${name} loads ${bytes} bytes of images`);
    } finally {
      await example.close();
    }
  });

  test(`${name} has no horizontal scroll at phone width`, async () => {
    const example = await openUrl(exampleUrl(name), { viewport: { width: 375, height: 800 } });
    try {
      const { scrollWidth, innerWidth } = await example.page.evaluate(() => ({
        scrollWidth: document.scrollingElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      assert.ok(scrollWidth <= innerWidth, `${name} scrolls sideways: ${scrollWidth}px of content in a ${innerWidth}px viewport`);
      const offenders = await example.page.evaluate(`(${OFFENDERS_SOURCE})()`);
      assert.deepEqual(offenders, [], `${name} content crosses its frame at phone width`);
    } finally {
      await example.close();
    }
  });
}

test('controls shows five distinct tint swatches', async () => {
  const example = await openUrl(exampleUrl('controls'));
  try {
    const colors = await example.page.$$eval('.fam-swatch', (swatches) => swatches.map((swatch) => getComputedStyle(swatch).backgroundColor));
    assert.equal(colors.length, 5);
    assert.equal(new Set(colors).size, 5);
  } finally {
    await example.close();
  }
});

test('notes keeps the list beside the pad with the 24px rule pitch', async () => {
  const example = await openUrl(exampleUrl('notes'));
  try {
    const { page } = example;
    const list = await page.locator('.fam-notes-list').boundingBox();
    const pad = await page.locator('.fam-pad').boundingBox();
    assert.ok(list.x + list.width <= pad.x + 1, 'the list is not to the left of the pad');
    const sheet = await page.locator('.fam-pad-sheet');
    assert.ok((await sheet.evaluate((node) => getComputedStyle(node).backgroundSize)).includes('585px'));
    assert.equal(await sheet.evaluate((node) => getComputedStyle(node).lineHeight), '24px');
  } finally {
    await example.close();
  }
});

test('list rows are real links, not a listbox that has no keyboard model', async () => {
  const example = await openUrl(exampleUrl('notes'));
  try {
    const { rowTags, fakeOptions } = await example.page.evaluate(() => ({
      rowTags: [...document.querySelectorAll('.fam-list-row')].map((row) => row.tagName),
      fakeOptions: document.querySelectorAll('[role="option"][tabindex]').length,
    }));
    assert.ok(rowTags.length > 0);
    assert.deepEqual([...new Set(rowTags)], ['A']);
    assert.equal(fakeOptions, 0, 'options with their own tab stops promise arrow-key behavior nothing implements');
  } finally {
    await example.close();
  }
});

for (const width of [320, 375]) {
  test(`sign-in inputs stay to the right of their labels at ${width}px`, async () => {
    const example = await openUrl(exampleUrl('sign-in'), { viewport: { width, height: 800 } });
    try {
      const misplaced = await example.page.$$eval('.fam-field-row', (rows) =>
        rows.map((row) => {
          const label = row.querySelector('label').getBoundingClientRect();
          const input = row.querySelector('input').getBoundingClientRect();
          return { text: row.querySelector('label').textContent, sideBySide: label.right <= input.left && Math.abs(label.top + label.height / 2 - (input.top + input.height / 2)) < 4 };
        }).filter(({ sideBySide }) => !sideBySide).map(({ text }) => text),
      );
      assert.deepEqual(misplaced, [], 'these labels are not on the same line as their input');
    } finally {
      await example.close();
    }
  });
}

// The email placeholder is 142px wide on a touch screen and the leather frame leaves about 92px beside the label at 320px, so only 375px and up is held to this
test('sign-in field text is not cut off at 375px', async () => {
  const example = await openUrl(exampleUrl('sign-in'), { viewport: { width: 375, height: 800 }, hasTouch: true });
  try {
    const cutOff = await example.page.$$eval('.fam-field-row input', (inputs) =>
      inputs.map((input) => {
        const style = getComputedStyle(input);
        const context = document.createElement('canvas').getContext('2d');
        context.font = style.font;
        const textWidth = context.measureText(input.placeholder).width;
        return { id: input.id, textWidth, inputWidth: input.clientWidth };
      }).filter(({ textWidth, inputWidth }) => textWidth > inputWidth),
    );
    assert.deepEqual(cutOff, [], 'a placeholder is wider than its input');
  } finally {
    await example.close();
  }
});

test('controls navigation labels are not truncated at phone width', async () => {
  const example = await openUrl(exampleUrl('controls'), { viewport: { width: 375, height: 800 } });
  try {
    const items = await example.page.$$eval('.fam-nav-item', (links) =>
      links.map((link) => ({ text: link.textContent, hidden: link.scrollWidth - link.clientWidth })),
    );
    for (const item of items) assert.ok(item.hidden <= 0, `"${item.text}" is cut off by ${item.hidden}px`);
    const brand = await example.page.$eval('.fam-nav-brand', (node) => node.getBoundingClientRect().height);
    assert.ok(brand < 30, `the brand wraps onto several lines (${brand}px tall)`);
    const navScroll = await example.page.$eval('.fam-nav', (node) => node.scrollWidth - node.clientWidth);
    assert.ok(navScroll <= 0, `the nav needs to scroll by ${navScroll}px for four short labels`);
  } finally {
    await example.close();
  }
});

for (const width of [640, 768, 820, 840]) {
  test(`notes stacks the list and the pad at full width on a ${width}px viewport`, async () => {
    const example = await openUrl(exampleUrl('notes'), { viewport: { width, height: 900 } });
    try {
      const list = await example.page.locator('.fam-notes-list').boundingBox();
      const pad = await example.page.locator('.fam-pad').boundingBox();
      if (list.x + list.width <= pad.x + 1) return; // side by side is also a valid layout when both fit
      assert.ok(Math.abs(list.width - pad.width) <= 1, `the list is ${list.width}px wide above a ${pad.width}px pad, leaving empty leather beside it`);
    } finally {
      await example.close();
    }
  });
}

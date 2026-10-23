import assert from 'node:assert/strict';
import test from 'node:test';
import { openUrl, showcasePageUrl } from './helpers/browser.mjs';

const glassUrl = showcasePageUrl('glass');

const DEFAULT_READOUT = '<div class="fam-glass fam-glass--refract" style="--fam-r: 90px; --fam-glow-depth: 18px; --fam-refract-blur: 1px"></div>';
const KNOBS = {
  blur: { min: 0, max: 30, initial: '1' },
  glow: { min: 0, max: 40, initial: '18' },
  radius: { min: 0, max: 90, initial: '90' },
};

const attribute = (page, selector, name) => page.locator(selector).getAttribute(name);
const lensVariable = (page, name) => page.evaluate((property) => document.querySelector('#lens').style.getPropertyValue(property), name);
const readout = (page) => page.textContent('#readout');
const press = async (page, key, times = 1) => {
  for (let count = 0; count < times; count += 1) await page.keyboard.press(key);
};

test('the glass section is complete in the HTML with JavaScript off', async () => {
  const page = await openUrl(glassUrl, { javaScriptEnabled: false });
  try {
    assert.ok((await page.page.getAttribute('#lens', 'class')).includes('fam-glass--refract'));
    assert.equal(await page.page.getAttribute('#lens', 'aria-hidden'), 'true');
    for (const [name, knob] of Object.entries(KNOBS)) {
      assert.equal(await attribute(page.page, `#knob-${name}`, 'aria-valuenow'), knob.initial, `${name} default`);
    }
    assert.equal(await readout(page.page), DEFAULT_READOUT);
    assert.ok((await page.page.textContent('#glass')).includes('Refraction shows in Chromium browsers. Elsewhere the lens is clear glass.'));
    assert.equal(await page.page.isChecked('#refract-switch'), true);
  } finally {
    await page.close();
  }
});

test('knobs are sliders that fit their touch behavior', async () => {
  const page = await openUrl(glassUrl);
  try {
    for (const [name, knob] of Object.entries(KNOBS)) {
      const selector = `#knob-${name}`;
      assert.equal(await attribute(page.page, selector, 'role'), 'slider');
      assert.equal(await attribute(page.page, selector, 'tabindex'), '0');
      assert.ok(await attribute(page.page, selector, 'aria-label'));
      assert.equal(await attribute(page.page, selector, 'aria-valuemin'), String(knob.min));
      assert.equal(await attribute(page.page, selector, 'aria-valuemax'), String(knob.max));
      assert.equal(await attribute(page.page, selector, 'aria-valuetext'), `${knob.initial}px`);
      assert.equal(await page.page.evaluate((target) => getComputedStyle(document.querySelector(target)).touchAction, selector), 'none');
    }
    // Vertical drags over the glass must still scroll the page on a touch screen
    assert.equal(await page.page.evaluate(() => getComputedStyle(document.querySelector('#glass')).touchAction), 'pan-y');
  } finally {
    await page.close();
  }
});

test('the keyboard turns each knob through its range', async () => {
  const page = await openUrl(glassUrl);
  try {
    const cases = [
      ['glow', '--fam-glow-depth', 'ArrowUp', 3, 21, '40'],
      ['radius', '--fam-r', 'ArrowDown', 4, 86, '90'],
      ['blur', '--fam-refract-blur', 'ArrowRight', 2, 3, '30'],
    ];
    for (const [name, variable, key, times, expected, maxValue] of cases) {
      await page.page.focus(`#knob-${name}`);
      await press(page.page, key, times);
      assert.equal(await attribute(page.page, `#knob-${name}`, 'aria-valuenow'), String(expected), `${name} after ${times} x ${key}`);
      assert.equal(await lensVariable(page.page, variable), `${expected}px`);
      assert.ok((await readout(page.page)).includes(`${variable}: ${expected}px`));
      await press(page.page, 'End');
      assert.equal(await attribute(page.page, `#knob-${name}`, 'aria-valuenow'), maxValue);
      assert.equal(await page.page.evaluate((id) => document.querySelector(id).style.getPropertyValue('--fam-knob-angle'), `#knob-${name}`), '135deg');
      await press(page.page, 'Home');
      assert.equal(await attribute(page.page, `#knob-${name}`, 'aria-valuenow'), '0');
      assert.equal(await page.page.evaluate((id) => document.querySelector(id).style.getPropertyValue('--fam-knob-angle'), `#knob-${name}`), '-135deg');
      assert.equal(await attribute(page.page, `#knob-${name}`, 'aria-valuetext'), '0px');
    }
    await page.page.focus('#knob-glow');
    await press(page.page, 'PageUp');
    assert.equal(await attribute(page.page, '#knob-glow', 'aria-valuenow'), '5');
    await press(page.page, 'PageDown');
    assert.equal(await attribute(page.page, '#knob-glow', 'aria-valuenow'), '0');
  } finally {
    await page.close();
  }
});

test('dragging a knob turns it to the pointer', async () => {
  const page = await openUrl(glassUrl);
  try {
    await page.page.locator('#knob-radius').scrollIntoViewIfNeeded();
    const box = await page.page.locator('#knob-radius').boundingBox();
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    // Straight up is the middle of the sweep, and a quarter turn clockwise from there is three quarters of the way round
    await page.page.mouse.move(centerX, centerY - 25);
    await page.page.mouse.down();
    const atTop = Number(await attribute(page.page, '#knob-radius', 'aria-valuenow'));
    assert.ok(Math.abs(atTop - 45) <= 2, `straight up gave ${atTop}`);
    await page.page.mouse.move(centerX + 25, centerY, { steps: 6 });
    const atRight = Number(await attribute(page.page, '#knob-radius', 'aria-valuenow'));
    await page.page.mouse.up();
    assert.ok(Math.abs(atRight - 75) <= 2, `a quarter turn clockwise gave ${atRight}`);
    assert.ok((await readout(page.page)).includes(`--fam-r: ${atRight}px`));
  } finally {
    await page.close();
  }
});

test('the switch changes the glass mode and each mode keeps its own blur', async () => {
  const page = await openUrl(glassUrl);
  try {
    await page.page.locator('#refract-switch').scrollIntoViewIfNeeded();
    await page.page.locator('.fam-switch:has(#refract-switch)').click();
    assert.equal(await page.page.isChecked('#refract-switch'), false);
    assert.ok(!(await attribute(page.page, '#lens', 'class')).includes('fam-glass--refract'));
    assert.equal(await attribute(page.page, '#knob-blur', 'aria-valuenow'), '14');
    assert.equal(await readout(page.page), '<div class="fam-glass" style="--fam-r: 90px; --fam-glow-depth: 18px; --fam-glass-blur: 14px"></div>');
    assert.equal(await lensVariable(page.page, '--fam-glass-blur'), '14px');
    assert.equal(await lensVariable(page.page, '--fam-refract-blur'), '');

    await page.page.focus('#knob-blur');
    await press(page.page, 'ArrowUp', 6);
    assert.equal(await lensVariable(page.page, '--fam-glass-blur'), '20px');

    await page.page.locator('.fam-switch:has(#refract-switch)').click();
    assert.equal(await attribute(page.page, '#knob-blur', 'aria-valuenow'), '1');
    assert.equal(await readout(page.page), DEFAULT_READOUT);
    assert.equal(await lensVariable(page.page, '--fam-glass-blur'), '');

    await page.page.locator('.fam-switch:has(#refract-switch)').click();
    assert.equal(await attribute(page.page, '#knob-blur', 'aria-valuenow'), '20');
  } finally {
    await page.close();
  }
});

test('the lens follows the pointer over the glass and not over the controls', async () => {
  const page = await openUrl(glassUrl);
  try {
    await page.page.locator('#glass').scrollIntoViewIfNeeded();
    const band = await page.page.locator('#glass').boundingBox();
    const center = () => page.page.evaluate(() => {
      const box = document.querySelector('#lens').getBoundingClientRect();
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    });
    for (const [x, y] of [[band.x + 200, band.y + 120], [band.x + band.width - 260, band.y + 180]]) {
      await page.page.mouse.move(x, y);
      await page.page.waitForFunction(
        ([targetX, targetY]) => {
          const box = document.querySelector('#lens').getBoundingClientRect();
          return Math.abs(box.x + box.width / 2 - targetX) <= 6 && Math.abs(box.y + box.height / 2 - targetY) <= 6;
        },
        [x, y],
        { timeout: 3000 },
      );
    }
    const resting = await center();
    const tray = await page.page.locator('#glass .tray').boundingBox();
    await page.page.mouse.move(tray.x + 10, tray.y + 10);
    await page.page.waitForTimeout(150);
    assert.deepEqual(await center(), resting, 'the lens chased the pointer onto the controls');
  } finally {
    await page.close();
  }
});

test('the knobs and the switch show keyboard focus', async () => {
  const page = await openUrl(glassUrl);
  try {
    const outline = (selector) =>
      page.page.evaluate((target) => {
        const style = getComputedStyle(document.querySelector(target));
        return `${style.outlineStyle} ${style.outlineWidth}`;
      }, selector);
    const drawsOutline = (value) => value.startsWith('solid') && !value.endsWith(' 0px');
    await page.page.focus('#knob-blur');
    assert.ok(drawsOutline(await outline('#knob-blur')), 'the focused knob has no outline');
    await page.page.focus('#refract-switch');
    assert.ok(drawsOutline(await outline('.fam-switch:has(#refract-switch)')), 'the focused switch has no outline');
    await page.page.focus('#knob-glow');
    assert.ok(!drawsOutline(await outline('#knob-blur')), 'a knob keeps its ring after losing focus');
  } finally {
    await page.close();
  }
});

for (const width of [1440, 768, 375]) {
  test(`the controls, the note and the readout do not overlap at ${width}px wide`, async () => {
    const page = await openUrl(glassUrl, { viewport: { width, height: 900 } });
    try {
      const boxes = await page.page.evaluate(() =>
        ['#glass .tray', '#glass .note', '#glass .glass-notes .cap'].map((selector) => {
          const box = document.querySelector(selector).getBoundingClientRect();
          return { selector, top: box.top, bottom: box.bottom };
        }),
      );
      for (let index = 1; index < boxes.length; index += 1) {
        assert.ok(
          boxes[index - 1].bottom <= boxes[index].top + 0.5,
          `${boxes[index - 1].selector} (bottom ${boxes[index - 1].bottom}) overlaps ${boxes[index].selector} (top ${boxes[index].top})`,
        );
      }
      const band = await page.page.evaluate(() => document.querySelector('#glass').getBoundingClientRect().bottom);
      assert.ok(boxes[2].bottom <= band + 0.5, 'the readout is cut off by the bottom of the band');
    } finally {
      await page.close();
    }
  });
}

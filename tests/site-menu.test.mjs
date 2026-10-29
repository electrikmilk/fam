import assert from 'node:assert/strict';
import test from 'node:test';
import { openUrl, showcasePageUrl } from './helpers/browser.mjs';

const PHONE = { viewport: { width: 375, height: 800 }, reducedMotion: 'reduce' };
const BAR_HEIGHT_PX = 64;
const SITE_LINKS = '.site-nav a.fam-nav-item:not(.site-nav-home)';
const TOGGLE = '.site-nav-toggle';

async function withControlsPage(options, check) {
  const page = await openUrl(showcasePageUrl('controls'), options);
  try {
    await check(page.page);
  } finally {
    await page.close();
  }
}

const visibleLinkBoxes = (page) =>
  page.$$eval(SITE_LINKS, (links) =>
    links
      .filter((link) => link.getClientRects().length > 0 && getComputedStyle(link).visibility !== 'hidden')
      .map((link) => link.getBoundingClientRect().toJSON()),
  );

test('the menu is closed on a phone until the toggle is pressed', async () => {
  await withControlsPage(PHONE, async (page) => {
    const toggle = page.locator(TOGGLE);
    assert.ok(await toggle.isVisible(), 'the toggle is not on the bar');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    const menuId = await toggle.getAttribute('aria-controls');
    assert.ok(menuId && (await page.locator(`#${menuId}`).count()) === 1, 'aria-controls does not name the menu');
    assert.deepEqual(await visibleLinkBoxes(page), [], 'the links show in the closed menu');
  });
});

test('pressing the toggle opens the menu with every page link on the screen, under the bar', async () => {
  await withControlsPage(PHONE, async (page) => {
    await page.locator(TOGGLE).click();
    assert.equal(await page.locator(TOGGLE).getAttribute('aria-expanded'), 'true');
    const boxes = await visibleLinkBoxes(page);
    assert.equal(boxes.length, 4, 'the four page links are not all showing');
    for (const box of boxes) {
      assert.ok(box.top >= BAR_HEIGHT_PX, `a link starts at ${box.top}px, inside the bar`);
      assert.ok(box.left >= 0 && box.right <= 375, `a link runs from ${box.left}px to ${box.right}px on a 375px screen`);
      assert.ok(box.height >= 44, `a link is ${box.height}px tall`);
    }
    assert.equal(await page.locator('.site-nav a[aria-current="page"]').textContent(), 'Controls');
  });
});

test('every link in the open menu is painted and can be pressed, not clipped by the bar', async () => {
  await withControlsPage(PHONE, async (page) => {
    await page.locator(TOGGLE).click();
    const covered = await page.$$eval(SITE_LINKS, (links) =>
      links
        .filter((link) => {
          const box = link.getBoundingClientRect();
          const topmost = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
          return !link.contains(topmost);
        })
        .map((link) => link.textContent),
    );
    assert.deepEqual(covered, [], 'something else is on top of these links');
  });
});

test('Escape closes the menu and returns focus to the toggle', async () => {
  await withControlsPage(PHONE, async (page) => {
    await page.locator(TOGGLE).click();
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), 'Materials', 'Tab did not reach the first link');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator(TOGGLE).getAttribute('aria-expanded'), 'false');
    assert.deepEqual(await visibleLinkBoxes(page), []);
    assert.ok(await page.locator(TOGGLE).evaluate((toggle) => toggle === document.activeElement), 'focus did not return to the toggle');
  });
});

test('pressing the dimmed page closes the menu', async () => {
  await withControlsPage(PHONE, async (page) => {
    await page.locator(TOGGLE).click();
    await page.mouse.click(190, 760);
    assert.equal(await page.locator(TOGGLE).getAttribute('aria-expanded'), 'false');
  });
});

test('pressing a link closes the menu', async () => {
  await withControlsPage(PHONE, async (page) => {
    await page.evaluate(() => window.addEventListener('click', (event) => event.preventDefault()));
    await page.locator(TOGGLE).click();
    await page.locator(SITE_LINKS).first().click();
    assert.equal(await page.locator(TOGGLE).getAttribute('aria-expanded'), 'false');
  });
});

test('the page behind the open menu is inert and does not scroll', async () => {
  await withControlsPage(PHONE, async (page) => {
    const state = () => page.evaluate(() => ({ inert: document.querySelector('main').inert, overflow: getComputedStyle(document.documentElement).overflow }));
    assert.deepEqual(await state(), { inert: false, overflow: 'visible' });
    await page.locator(TOGGLE).click();
    assert.deepEqual(await state(), { inert: true, overflow: 'hidden' });
    await page.keyboard.press('Escape');
    assert.deepEqual(await state(), { inert: false, overflow: 'visible' });
  });
});

test('widening the screen past a phone closes the menu and puts the links back in the bar', async () => {
  await withControlsPage(PHONE, async (page) => {
    await page.locator(TOGGLE).click();
    await page.setViewportSize({ width: 700, height: 800 });
    assert.ok(!(await page.locator(TOGGLE).isVisible()), 'the toggle still shows on a wide screen');
    const boxes = await visibleLinkBoxes(page);
    assert.equal(boxes.length, 4);
    for (const box of boxes) assert.ok(box.bottom <= BAR_HEIGHT_PX, `a link sits at ${box.bottom}px, below the bar`);
    assert.equal(await page.evaluate(() => document.querySelector('main').inert), false, 'the page is still inert');
  });
});

test('a wide screen keeps the links in the bar with no toggle', async () => {
  await withControlsPage({ viewport: { width: 700, height: 800 } }, async (page) => {
    assert.ok(!(await page.locator(TOGGLE).isVisible()));
    assert.equal((await visibleLinkBoxes(page)).length, 4);
  });
});

test('without JavaScript the links stay in the bar on a phone', async () => {
  await withControlsPage({ viewport: { width: 375, height: 800 }, javaScriptEnabled: false }, async (page) => {
    assert.equal(await page.locator(TOGGLE).count(), 0, 'the toggle exists without a script to run it');
    const boxes = await visibleLinkBoxes(page);
    assert.equal(boxes.length, 4);
    for (const box of boxes) assert.ok(box.right <= 375 && box.bottom <= BAR_HEIGHT_PX, 'a link is outside the bar');
  });
});

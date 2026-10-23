import assert from 'node:assert/strict';
import test from 'node:test';
import { fixtureUrl, openUrl } from './helpers/browser.mjs';

const thumbAndTrack = (page, selector) =>
  page.evaluate((target) => {
    const track = document.querySelector(target).getBoundingClientRect();
    const thumb = document.querySelector(`${target} .fam-switch-knob`).getBoundingClientRect();
    return { track: { left: track.left, right: track.right, top: track.top, bottom: track.bottom }, thumb: { left: thumb.left, right: thumb.right, top: thumb.top, bottom: thumb.bottom } };
  }, selector);

test('the thumb overhangs the track at both ends and above and below', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const off = await thumbAndTrack(kit.page, '#switch-off');
    assert.ok(off.thumb.left < off.track.left, 'the off thumb does not stick out past the left end');
    assert.ok(off.thumb.top < off.track.top && off.thumb.bottom > off.track.bottom, 'the thumb is not taller than the track');
    const on = await thumbAndTrack(kit.page, '#switch-on');
    assert.ok(on.thumb.right > on.track.right, 'the on thumb does not stick out past the right end');
  } finally {
    await kit.close();
  }
});

test('clicking the part of the thumb that sticks out still toggles the switch', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { page } = kit;
    await page.locator('#switch-off').scrollIntoViewIfNeeded();
    const { track, thumb } = await thumbAndTrack(page, '#switch-off');
    // A point inside the thumb but outside the track
    await page.mouse.click(thumb.left + 1.5, (track.top + track.bottom) / 2);
    assert.equal(await page.isChecked('#switch-off input'), true);
  } finally {
    await kit.close();
  }
});

// Reads the thumb's position before the click, then on every frame for 700ms after it
const positionsDuringToggle = (page) =>
  page.evaluate(
    () =>
      new Promise((resolve) => {
        const thumb = document.querySelector('#switch-off .fam-switch-knob');
        const before = Math.round(thumb.getBoundingClientRect().left);
        const positions = [];
        const start = performance.now();
        document.querySelector('#switch-off input').click();
        const sample = () => {
          positions.push(Math.round(thumb.getBoundingClientRect().left));
          if (performance.now() - start < 700) requestAnimationFrame(sample);
          else resolve({ before, positions });
        };
        requestAnimationFrame(sample);
      }),
  );

test('the thumb slides to its new position', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const { before: first, positions } = await positionsDuringToggle(kit.page);
    const last = positions[positions.length - 1];
    assert.ok(last - first > 30, `the thumb only moved ${last - first}px`);
    const between = positions.filter((position) => position > first + 3 && position < last - 3);
    assert.ok(between.length >= 3, `the thumb jumped: only ${between.length} frames between start and end`);
  } finally {
    await kit.close();
  }
});

test('the thumb jumps without sliding under reduced motion', async () => {
  const kit = await openUrl(fixtureUrl('kit'), { reducedMotion: 'reduce' });
  try {
    const { before: first, positions } = await positionsDuringToggle(kit.page);
    const last = positions[positions.length - 1];
    assert.ok(last - first > 30, 'the switch did not toggle');
    const between = positions.filter((position) => position > first + 3 && position < last - 3);
    assert.ok(between.length <= 1, `the thumb still slid across ${between.length} frames`);
  } finally {
    await kit.close();
  }
});

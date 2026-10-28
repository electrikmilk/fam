import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';
import { exampleUrl, fixtureUrl, openUrl } from './helpers/browser.mjs';
import { statistics } from './helpers/pixels.mjs';

const prototypeUrl = pathToFileURL(
  fileURLToPath(new URL('../docs/superpowers/reference/demo-reference.html', import.meta.url)),
).href;

async function centerShot(page, selector) {
  const target = page.locator(selector).first();
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  return page.screenshot({ clip: { x: box.x + 8, y: box.y + 8, width: box.width - 16, height: box.height - 16 } });
}

test('felt tint matches the prototype multiply technique', async () => {
  const prototype = await openUrl(prototypeUrl);
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const expected = statistics(await centerShot(prototype.page, '.swatch.tinted'));
    const actual = statistics(await centerShot(kit.page, '#felt-green'));
    for (let channel = 0; channel < 3; channel += 1) {
      assert.ok(
        Math.abs(expected.mean[channel] - actual.mean[channel]) <= 4,
        `channel ${channel} mean ${actual.mean[channel]} vs prototype ${expected.mean[channel]}`,
      );
      const deviationRatio = actual.deviation[channel] / expected.deviation[channel];
      assert.ok(deviationRatio > 0.85 && deviationRatio < 1.15, `channel ${channel} deviation ratio ${deviationRatio}`);
    }
  } finally {
    await prototype.close();
    await kit.close();
  }
});

test('cardstock is natural by default and --fam-cardstock-tint multiplies it onto a color', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  const notes = await openUrl(exampleUrl('notes'));
  try {
    const natural = statistics(await centerShot(kit.page, '#cardstock'));
    await kit.page.evaluate(() => document.getElementById('cardstock').style.setProperty('--fam-cardstock-tint', '#562a0e'));
    const brown = statistics(await centerShot(kit.page, '#cardstock'));
    const bar = statistics(await centerShot(notes.page, '.fam-pad-bar'));
    assert.ok(natural.mean.every((channel) => channel > 150), `default cardstock mean is ${natural.mean}`);
    assert.ok(brown.mean[0] < 90, `tinted cardstock mean is ${brown.mean}`);
    assert.ok(bar.mean[0] < 90, `the notes title bar lost its brown: ${bar.mean}`);
  } finally {
    await kit.close();
    await notes.close();
  }
});

test('materials load their textures', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    assert.deepEqual(kit.issues, []);
    const styles = await kit.page.evaluate(() =>
      Object.fromEntries(
        ['wood', 'wood-paneled', 'metal-brushed', 'metal', 'leather', 'pebbled-tan', 'pebbled-black', 'pebbled-brown', 'linen', 'cardboard', 'cardboard-chipboard', 'cardstock', 'legal-pad', 'paper', 'cork', 'frame-tan', 'felt-green'].map((id) => [
          id,
          getComputedStyle(document.getElementById(id)).backgroundImage,
        ]),
      ),
    );
    for (const [id, backgroundImage] of Object.entries(styles)) {
      assert.ok(backgroundImage.includes('url('), `${id} has no texture: ${backgroundImage}`);
    }
    const frameSource = await kit.page.evaluate(() => getComputedStyle(document.getElementById('frame-tan')).borderImageSource);
    assert.ok(frameSource.includes('leather-frame-tan-soft.png'), frameSource);
    const blackSource = await kit.page.evaluate(() => getComputedStyle(document.getElementById('frame-black')).borderImageSource);
    assert.ok(blackSource.includes('leather-frame-black-soft.png'), blackSource);
    const brownFrameSource = await kit.page.evaluate(() => getComputedStyle(document.getElementById('frame-brown')).borderImageSource);
    assert.ok(brownFrameSource.includes('leather-frame-brown-soft.png'), brownFrameSource);
    const barImages = await kit.page.evaluate(() =>
      ['bar-tan', 'bar-black', 'bar-brown'].map((id) => getComputedStyle(document.getElementById(id)).backgroundImage),
    );
    assert.ok(barImages[0].includes('leather-bar-edge-tan.png') && barImages[0].includes('leather-fill-tan-tile.jpg'), barImages[0]);
    assert.ok(barImages[1].includes('leather-bar-edge-black.png') && barImages[1].includes('leather-fill-black-tile.jpg'), barImages[1]);
    assert.ok(barImages[2].includes('leather-bar-edge-brown.png') && barImages[2].includes('leather-fill-brown-tile.jpg'), barImages[2]);
    const pebbledImages = await kit.page.evaluate(() =>
      ['pebbled-tan', 'pebbled-black', 'pebbled-brown'].map((id) => getComputedStyle(document.getElementById(id)).backgroundImage),
    );
    assert.ok(pebbledImages[0].includes('leather-fill-tan-tile.jpg') && !pebbledImages[0].includes('bar-edge'), pebbledImages[0]);
    assert.ok(pebbledImages[1].includes('leather-fill-black-tile.jpg') && !pebbledImages[1].includes('bar-edge'), pebbledImages[1]);
    assert.ok(pebbledImages[2].includes('leather-fill-brown-tile.jpg') && !pebbledImages[2].includes('bar-edge'), pebbledImages[2]);
  } finally {
    await kit.close();
  }
});

test('linen takes its tint', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    for (const tint of ['#000000', '#ffffff']) {
      const background = await kit.page.evaluate((value) => {
        const linen = document.getElementById('linen');
        linen.style.setProperty('--fam-linen-tint', value);
        return getComputedStyle(linen).backgroundColor;
      }, tint);
      const channel = tint === '#000000' ? 0 : 255;
      assert.equal(background, `rgb(${channel}, ${channel}, ${channel})`, `linen ignores --fam-linen-tint ${tint}`);
    }
  } finally {
    await kit.close();
  }
});

test('linen is gray until it is tinted', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const background = await kit.page.evaluate(() => getComputedStyle(document.getElementById('linen')).backgroundColor);
    const [red, green, blue] = background.match(/\d+/g).map(Number);
    assert.ok(red === green && green === blue, `the default linen is not gray: ${background}`);
  } finally {
    await kit.close();
  }
});

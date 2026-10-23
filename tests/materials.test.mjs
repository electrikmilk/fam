import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';
import { fixtureUrl, openUrl } from './helpers/browser.mjs';
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

test('materials load their textures', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    assert.deepEqual(kit.issues, []);
    const styles = await kit.page.evaluate(() =>
      Object.fromEntries(
        ['wood', 'metal', 'leather', 'cardstock', 'legal-pad', 'paper', 'frame-tan', 'felt-green'].map((id) => [
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
  } finally {
    await kit.close();
  }
});

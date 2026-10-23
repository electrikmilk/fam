import assert from 'node:assert/strict';
import test from 'node:test';
import { fixtureUrl, openUrl } from './helpers/browser.mjs';

test('wood frame draws the photo border with an inset shadow and a drop shadow', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    assert.deepEqual(kit.issues, []);
    const styles = await kit.page.evaluate(() => {
      const frame = document.getElementById('wood-frame');
      const overlay = getComputedStyle(frame, '::after');
      return {
        borderImageSource: getComputedStyle(frame).borderImageSource,
        borderLeftWidth: getComputedStyle(frame).borderLeftWidth,
        dropShadow: getComputedStyle(frame).boxShadow,
        overlayShadow: overlay.boxShadow,
        overlayBackground: overlay.backgroundImage,
      };
    });
    assert.ok(styles.borderImageSource.includes('wood-frame.jpg'), styles.borderImageSource);
    assert.equal(styles.borderLeftWidth, '40px');
    assert.ok(!styles.dropShadow.includes('inset') && styles.dropShadow !== 'none', styles.dropShadow);
    assert.ok(styles.overlayShadow.includes('inset'), styles.overlayShadow);
    assert.equal(styles.overlayBackground, 'none');
  } finally {
    await kit.close();
  }
});

test('only the glossy wood frame has a sheen over the image', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const sheen = await kit.page.evaluate(() => getComputedStyle(document.getElementById('wood-frame-glossy'), '::after').backgroundImage);
    assert.ok(sheen.includes('linear-gradient'), sheen);
  } finally {
    await kit.close();
  }
});

test('print frame takes its margin from the paper or cardstock material and edges the photo', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const styles = await kit.page.evaluate(() =>
      Object.fromEntries(
        ['print-paper', 'print-cardstock'].map((id) => {
          const frame = document.getElementById(id);
          const overlay = getComputedStyle(frame, '::after');
          return [id, {
            padding: getComputedStyle(frame).paddingLeft,
            texture: getComputedStyle(frame).backgroundImage,
            overlayInset: overlay.top,
            overlayShadow: overlay.boxShadow,
            overlayPointerEvents: overlay.pointerEvents,
          }];
        }),
      ),
    );
    assert.ok(styles['print-paper'].texture.includes('paper-tile.jpg'), styles['print-paper'].texture);
    assert.ok(styles['print-cardstock'].texture.includes('cardstock-tile.jpg'), styles['print-cardstock'].texture);
    for (const [id, style] of Object.entries(styles)) {
      assert.equal(style.padding, '14px', id);
      assert.equal(style.overlayInset, '14px', id);
      assert.ok(style.overlayShadow.includes('inset'), `${id}: ${style.overlayShadow}`);
      assert.equal(style.overlayPointerEvents, 'none', id);
    }
  } finally {
    await kit.close();
  }
});

test('the wood frame overlay does not block the content inside it', async () => {
  const kit = await openUrl(fixtureUrl('kit'));
  try {
    const button = kit.page.locator('#wood-frame-content');
    await button.scrollIntoViewIfNeeded();
    const box = await button.boundingBox();
    const topElementId = await kit.page.evaluate(
      ({ x, y }) => document.elementFromPoint(x, y)?.id,
      { x: box.x + box.width / 2, y: box.y + box.height / 2 },
    );
    assert.equal(topElementId, 'wood-frame-content');
  } finally {
    await kit.close();
  }
});

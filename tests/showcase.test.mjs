import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';
import { openUrl, showcasePageUrl, showcaseUrl } from './helpers/browser.mjs';
import { OFFENDERS_SOURCE } from './helpers/layout.mjs';

const IMAGE_BUDGET_BYTES = 300 * 1024;
const TOTAL_IMAGE_BUDGET_BYTES = 3 * 1024 * 1024;

const PAGE_NAMES = ['index', 'materials', 'controls', 'glass', 'examples'];
const materialsUrl = showcasePageUrl('materials');

for (const pageName of PAGE_NAMES) {
  test(`${pageName} loads cleanly within the image budget`, async () => {
    const page = await openUrl(showcasePageUrl(pageName));
    try {
      assert.deepEqual(page.issues, []);
      const bytes = await page.imageBytes();
      assert.ok(bytes <= TOTAL_IMAGE_BUDGET_BYTES, `the page loads ${bytes} bytes of images`);
    } finally {
      await page.close();
    }
  });
}

test('each photo is within its size budget', async () => {
  for (const name of ['ribbon.jpg', 'tree.jpg', 'snow-leopard.jpg']) {
    const { size } = await stat(new URL(`../showcase/images/${name}`, import.meta.url));
    assert.ok(size <= IMAGE_BUDGET_BYTES, `${name} is ${size} bytes`);
  }
});

test('opening screen is tan stitched leather, like the site bar, with serif engraved text', async () => {
  const page = await openUrl(showcaseUrl);
  try {
    const read = (selector, property) => page.page.evaluate(([target, name]) => getComputedStyle(document.querySelector(target))[name], [selector, property]);
    assert.equal(await page.page.textContent('#hero h1'), 'Fam');
    assert.equal(await page.page.textContent('#hero .tagline'), 'Familiar materials for the web');
    assert.ok((await read('#hero h1', 'fontFamily')).startsWith('Georgia'));
    assert.ok((await read('#hero .tagline', 'fontFamily')).startsWith('Georgia'));
    assert.ok((await read('.site-nav .fam-nav-brand', 'fontFamily')).startsWith('Georgia'));
    const heroBackground = await read('#hero', 'backgroundImage');
    assert.ok(heroBackground.includes('leather-fill-tan-tile.jpg') && heroBackground.includes('leather-bar-edge-tan.png'), heroBackground);
    assert.equal(await read('#hero', 'backgroundImage'), await read('.site-nav', 'backgroundImage'), 'the hero and the site bar use different leather');
  } finally {
    await page.close();
  }
});

test('credits name both photographers and link the credits file', async () => {
  const page = await openUrl(showcaseUrl);
  try {
    const { text, links } = await page.page.evaluate(() => ({
      text: document.querySelector('#credits').textContent,
      links: [...document.querySelectorAll('#credits a')].map((link) => link.href),
    }));
    assert.ok(text.includes('boliviainteligente') && text.includes('mehrab-sium'), text);
    assert.ok(links.some((href) => href.endsWith('CREDITS.md')), links.join(', '));
  } finally {
    await page.close();
  }
});

for (const pageName of PAGE_NAMES) {
  test(`${pageName} copy has no em dashes`, async () => {
    const page = await openUrl(showcasePageUrl(pageName));
    try {
      assert.ok(!(await page.page.evaluate(() => document.body.textContent)).includes('—'));
    } finally {
      await page.close();
    }
  });
}

test('every refracting glass on the glass page gets a filter that exists, with no filter pasted into the page', async () => {
  const page = await openUrl(showcasePageUrl('glass'));
  try {
    const { glassCount, missing, pastedFilters } = await page.page.evaluate(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const glass = [...document.querySelectorAll('.fam-glass--refract')];
      const missingFilters = glass.filter((element) => {
        const reference = element.style.getPropertyValue('--fam-refract-filter');
        return !reference.startsWith('url(#') || !document.getElementById(reference.slice('url(#'.length, -1));
      });
      return {
        glassCount: glass.length,
        missing: missingFilters.length,
        pastedFilters: document.querySelectorAll('filter#fam-refract').length,
      };
    });
    assert.ok(glassCount > 0);
    assert.equal(missing, 0, `${missing} of ${glassCount} refracting glass have no injected filter`);
    assert.equal(pastedFilters, 0);
  } finally {
    await page.close();
  }
});

for (const pageName of PAGE_NAMES) {
  test(`${pageName} has no horizontal scroll at phone width`, async () => {
    const page = await openUrl(showcasePageUrl(pageName), { viewport: { width: 375, height: 800 } });
    try {
      const { scrollWidth, innerWidth } = await page.page.evaluate(() => ({ scrollWidth: document.scrollingElement.scrollWidth, innerWidth: window.innerWidth }));
      assert.ok(scrollWidth <= innerWidth, `the page scrolls sideways: ${scrollWidth}px in a ${innerWidth}px viewport`);
      assert.deepEqual(await page.page.evaluate(`(${OFFENDERS_SOURCE})()`), []);
    } finally {
      await page.close();
    }
  });
}

// The page may only claim what the package does: every class a caption names must be defined in the real stylesheet
test('every class in a caption exists in the kit', async () => {
  const css = await readFile(new URL('../dist/fam-ui.css', import.meta.url), 'utf8');
  const names = new Set();
  for (const pageName of PAGE_NAMES) {
    const page = await openUrl(showcasePageUrl(pageName));
    try {
      const found = await page.page.$$eval('.cap code, .code-block code, .ref-table code', (codes) => codes.flatMap((code) => code.textContent.match(/(?<![-\w])fam-(?!ui\/)[a-z0-9-]+/g) ?? []));
      for (const name of found) names.add(name);
    } finally {
      await page.close();
    }
  }
  assert.ok(names.size >= 25, `only ${names.size} classes are named in captions`);
  for (const name of names) assert.ok(css.includes(`.${name}`), `a caption names .${name} but the stylesheet does not define it`);
});

const SCENE_PAGE_NAMES = ['materials', 'controls', 'glass'];

// Runs in the page. A snippet or caption may only name kit classes its demo uses. A scene with a code block must also name every
// kit class its demo uses, so what a visitor copies is the whole demo.
const MISMATCHES_SOURCE = `(containerSelector) => {
  const kitClasses = (text) => text.match(/(?<![-\\w])fam-(?!ui\\/)[a-z0-9-]+/g) ?? [];
  return [...document.querySelectorAll(containerSelector)].flatMap((container) => {
    const written = new Set(kitClasses([...container.querySelectorAll('.cap code, .code-block code')].map((code) => code.textContent).join(' ')));
    const used = new Set(
      [...container.querySelectorAll('.window, .window [class]')]
        .filter((element) => !element.closest('.code-block'))
        .flatMap((element) => [...element.classList])
        .filter((name) => name.startsWith('fam-')),
    );
    const notInDemo = [...written].filter((name) => !used.has(name)).map((name) => container.id + ': snippet names ' + name + ' but the demo does not use it');
    const hasCodeBlock = container.querySelector('.code-block') !== null;
    const notInSnippet = hasCodeBlock ? [...used].filter((name) => !written.has(name)).map((name) => container.id + ': demo uses ' + name + ' but the snippet does not show it') : [];
    return [...notInDemo, ...notInSnippet];
  });
}`;

for (const pageName of SCENE_PAGE_NAMES) {
  test(`captions and snippets match the markup of their scene on ${pageName}`, async () => {
    const page = await openUrl(showcasePageUrl(pageName));
    try {
      assert.ok((await page.page.$$('section.scene')).length >= 1, 'the scenes are missing');
      assert.deepEqual(await page.page.evaluate(`(${MISMATCHES_SOURCE})('section.scene')`), []);
    } finally {
      await page.close();
    }
  });

  test(`scenes on ${pageName} are framed windows with real content and work with JavaScript off`, async () => {
    const page = await openUrl(showcasePageUrl(pageName), { javaScriptEnabled: false });
    try {
      const scenes = await page.page.$$eval('section.scene', (sections) =>
        sections.map((section) => ({
          id: section.id,
          height: section.getBoundingClientRect().height,
          captionVisible: section.querySelector('.cap code, .code-block code').getBoundingClientRect().height > 0,
          windows: [...section.querySelectorAll('.window')].map((window) => getComputedStyle(window).boxShadow !== 'none'),
        })),
      );
      assert.ok(scenes.length >= 1, 'the scenes are missing');
      for (const scene of scenes) {
        assert.ok(scene.height > 100, `${scene.id} is empty`);
        assert.ok(scene.captionVisible, `${scene.id} has no visible caption`);
        assert.ok(scene.windows.length > 0 && scene.windows.every(Boolean), `${scene.id} has an unframed window`);
      }
    } finally {
      await page.close();
    }
  });
}

test('the materials page holds the textures, then the effects, bars, frames and engraved text', async () => {
  const page = await openUrl(materialsUrl);
  try {
    const ids = await page.page.$$eval('section.scene', (sections) => sections.map((section) => section.id));
    assert.deepEqual(ids, ['scene-build', 'scene-effects', 'scene-navs', 'scene-frames', 'scene-engraved']);
  } finally {
    await page.close();
  }
});

test('navigation bars are wood, leather, metal, paper or cardstock, and the leather ones are stitched', async () => {
  const page = await openUrl(materialsUrl);
  try {
    const bars = await page.page.$$eval('#scene-navs .navs-window .fam-nav', (navs) => navs.map((nav) => [...nav.classList].filter((name) => name !== 'fam-nav')));
    const allowed = ['fam-wood', 'fam-wood-paneled', 'fam-metal-brushed', 'fam-metal', 'fam-paper', 'fam-cardstock', 'fam-leather-bar'];
    for (const classes of bars) assert.ok(classes.some((name) => allowed.includes(name)), `${classes.join(' ')} is not a wood, leather, metal, paper or cardstock bar`);
    assert.ok(!bars.flat().some((name) => name.startsWith('fam-leather-pebbled')), 'a leather bar has no stitching');
    for (const required of allowed) assert.ok(bars.some((classes) => classes.includes(required)), `no ${required} bar is shown`);
  } finally {
    await page.close();
  }
});

test('leather bars keep 8px of padding under their items so the stitches clear the active pocket', async () => {
  const page = await openUrl(materialsUrl);
  try {
    const paddings = await page.page.$$eval('#scene-navs .fam-nav.fam-leather-bar', (bars) => bars.map((bar) => getComputedStyle(bar).paddingBottom));
    assert.ok(paddings.length >= 3, 'the tan, black and brown leather bars are missing');
    assert.deepEqual(paddings, paddings.map(() => '8px'));
  } finally {
    await page.close();
  }
});

test('build your own shows every texture, labeled with the classes it uses', async () => {
  const page = await openUrl(materialsUrl);
  try {
    const squares = await page.page.$$eval('#scene-build .swatches .sq', (figures) =>
      figures.map((figure) => ({
        classes: [...figure.querySelector('.swatch').classList],
        properties: [...figure.querySelector('.swatch').style].filter((name) => name.startsWith('--')),
        label: figure.querySelector('figcaption').textContent.trim(),
      })),
    );
    assert.equal(squares.length, 25);
    for (const square of squares) {
      for (const token of square.label.split(/\s+/)) {
        if (token.startsWith('--fam-')) assert.ok(square.properties.includes(token), `${token} is labeled but not set on its square`);
        else assert.ok(square.classes.includes(token), `${token} is labeled but not on its square (${square.classes.join(' ')})`);
      }
    }
    const textures = ['fam-felt', 'fam-linen', 'fam-denim', 'fam-wood', 'fam-wood-paneled', 'fam-metal-brushed', 'fam-metal', 'fam-leather', 'fam-leather-pebbled', 'fam-paper', 'fam-paper-bag', 'fam-lined-paper', 'fam-grid-paper', 'fam-blackboard', 'fam-chalkboard', 'fam-cork', 'fam-cardboard', 'fam-cardstock', 'fam-legal-pad', 'fam-leather-frame'];
    const shown = new Set(squares.flatMap((square) => square.classes));
    for (const texture of textures) assert.ok(shown.has(texture), `${texture} has no square`);
    assert.ok(squares.some((square) => square.properties.includes('--fam-cardstock-tint')), 'tinted cardstock has no square');
    assert.ok(squares.some((square) => square.properties.includes('--fam-linen-tint')), 'tinted linen has no square');
    assert.ok(squares.some((square) => square.properties.includes('--fam-denim-tint')), 'tinted denim has no square');
  } finally {
    await page.close();
  }
});

test('build your own shows felt, linen, denim and cardstock in five colors each', async () => {
  const page = await openUrl(materialsUrl);
  try {
    for (const material of ['felt', 'linen', 'denim', 'cardstock']) {
      const colors = await page.page.$$eval(`#scene-build .tint.fam-${material}`, (tints) => tints.map((tint) => getComputedStyle(tint).backgroundColor));
      assert.equal(colors.length, 5, `${material} has ${colors.length} tints`);
      assert.equal(new Set(colors).size, 5, `${material} tints are not five different colors`);
    }
  } finally {
    await page.close();
  }
});

test('the effects section shows gloss, rounding and shadow utilities', async () => {
  const page = await openUrl(materialsUrl);
  try {
    const found = await page.page.evaluate(() => {
      const scene = document.querySelector('#scene-effects');
      const has = (names) => names.map((name) => Boolean(scene.querySelector(`.${name}`)));
      return {
        gloss: has(['fam-gloss-none', 'fam-gloss-soft', 'fam-gloss-strong']),
        rounding: has(['fam-round-sm', 'fam-round-md', 'fam-round-lg', 'fam-round-pill']),
        shadows: ['shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-inset', 'cast-sm', 'cast-md', 'cast-lg'].map((name) => getComputedStyle(scene.querySelector(`.fam-${name}`)).boxShadow),
        grounded: has(['fam-grounded-sm', 'fam-grounded-md', 'fam-grounded-lg']),
        reflection: getComputedStyle(scene.querySelector('.fam-reflect')).webkitBoxReflect,
        shelfFloor: getComputedStyle(scene.querySelector('.fam-shelf'), '::before').content,
      };
    });
    assert.ok(found.gloss.every(Boolean) && found.rounding.every(Boolean));
    assert.ok(found.shadows.every((shadow) => shadow !== 'none'));
    assert.equal(new Set(found.shadows).size, 7);
    assert.ok(found.grounded.every(Boolean), 'the scene shows all three resting levels');
    assert.notEqual(found.reflection, 'none', 'fam-reflect draws no reflection');
    assert.notEqual(found.shelfFloor, 'none', 'fam-shelf draws no floor');
  } finally {
    await page.close();
  }
});

// A page stub for navigator.clipboard that records what the page asks to copy
const RECORDING_CLIPBOARD = `window.__copied = []; Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (text) => { window.__copied.push(text); } } });`;
const REJECTING_CLIPBOARD = `Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('denied'); } } });`;
const NO_CLIPBOARD = `Object.defineProperty(navigator, 'clipboard', { value: undefined });`;

test('every code block gets a copy button in its header that copies its markup', async () => {
  const page = await openUrl(materialsUrl, { initScript: RECORDING_CLIPBOARD });
  try {
    const counts = await page.page.evaluate(() => ({
      blocks: document.querySelectorAll('.code-block').length,
      headerButtons: document.querySelectorAll('.code-block .code-head > button.copy').length,
      captions: document.querySelectorAll('code.copyable').length,
      captionButtons: document.querySelectorAll('code.copyable + button.copy').length,
    }));
    assert.ok(counts.blocks >= 3, 'the code blocks are missing');
    assert.equal(counts.headerButtons, counts.blocks);
    assert.equal(counts.captionButtons, counts.captions);

    const first = page.page.locator('#scene-frames .copy');
    assert.ok((await first.getAttribute('aria-label')).includes('photo frame and cork'), 'the button does not say what it copies');
    await first.click();
    const expected = await page.page.textContent('#scene-frames .code-block code');
    assert.ok(expected.startsWith('<figure class="fam-print-frame fam-paper">'), 'the block does not hold the demo markup');
    assert.deepEqual(await page.page.evaluate(() => window.__copied), [expected]);
    assert.equal(await first.textContent(), 'Copied');
    assert.ok((await page.page.textContent('[role="status"]')).includes('Copied'));
    await page.page.waitForFunction(() => document.querySelector('#scene-frames .copy').textContent === 'Copy', null, { timeout: 4000 });
  } finally {
    await page.close();
  }
});

test('long code blocks start collapsed, expand on request and still copy in full', async () => {
  const page = await openUrl(showcasePageUrl('controls'), { initScript: RECORDING_CLIPBOARD });
  try {
    const firstCollapsedId = await page.page.locator('.code-block.is-collapsed pre').first().getAttribute('id');
    const block = page.page.locator('.code-block', { has: page.page.locator(`#${firstCollapsedId}`) });
    const pre = block.locator('pre');
    const toggle = block.locator('.toggle');
    const collapsedHeight = await pre.evaluate((element) => element.clientHeight);
    assert.ok(collapsedHeight < (await pre.evaluate((element) => element.scrollHeight)), 'the block is not clipped');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');

    await block.locator('.copy').click();
    const fullMarkup = await block.locator('code').textContent();
    assert.deepEqual(await page.page.evaluate(() => window.__copied), [fullMarkup]);

    await toggle.click();
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
    assert.ok((await pre.evaluate((element) => element.clientHeight)) > collapsedHeight, 'the block did not open');
    assert.equal(await toggle.textContent(), 'Show less');
  } finally {
    await page.close();
  }
});

test('code blocks show in full with JavaScript off', async () => {
  const page = await openUrl(showcasePageUrl('controls'), { javaScriptEnabled: false });
  try {
    assert.equal(await page.page.locator('.code-block.is-collapsed, .code-head .toggle').count(), 0);
  } finally {
    await page.close();
  }
});

test('a refused copy says so', async () => {
  const page = await openUrl(materialsUrl, { initScript: REJECTING_CLIPBOARD });
  try {
    const button = page.page.locator('#scene-frames .copy');
    await button.click();
    await page.page.waitForFunction(() => document.querySelector('#scene-frames .copy').textContent === 'Copy failed');
    assert.ok((await page.page.textContent('[role="status"]')).includes('Copy failed'));
  } finally {
    await page.close();
  }
});

test('no copy buttons appear without the clipboard API', async () => {
  const page = await openUrl(materialsUrl, { initScript: NO_CLIPBOARD });
  try {
    assert.equal(await page.page.locator('.copy').count(), 0);
  } finally {
    await page.close();
  }
});

// The opening screen stops short of the bottom, so the top of the next section shows and scrolling is obvious without a "Scroll" cue
for (const [width, height] of [[1440, 900], [768, 1024], [375, 700]]) {
  test(`the next section peeks into the first screen at ${width} by ${height}`, async () => {
    const page = await openUrl(showcaseUrl, { viewport: { width, height } });
    try {
      const { heroBottom, headingTop, cues } = await page.page.evaluate(() => ({
        heroBottom: document.querySelector('#hero').getBoundingClientRect().bottom,
        headingTop: document.querySelector('#why h2').getBoundingClientRect().top,
        cues: document.querySelectorAll('.scroll-cue').length,
      }));
      assert.ok(heroBottom < height - 60, `the opening screen ends at ${heroBottom}px of a ${height}px viewport`);
      assert.ok(headingTop < height - 60, `the first section starts at ${headingTop}px, below the fold of a ${height}px viewport`);
      assert.equal(cues, 0, 'the scroll cue is still on the page');
    } finally {
      await page.close();
    }
  });
}

test('the pairing panels are all visible with JavaScript off', async () => {
  const page = await openUrl(showcaseUrl, { javaScriptEnabled: false });
  try {
    const panels = await page.page.$$eval('.pairing-panel', (elements) => elements.map((element) => ({ id: element.id, height: element.getBoundingClientRect().height })));
    assert.equal(panels.length, 7);
    for (const panel of panels) assert.ok(panel.height > 100, `${panel.id} is hidden`);
    assert.equal(await page.page.locator('[role="tab"]').count(), 0);
  } finally {
    await page.close();
  }
});

test('the pairing tabs show one panel at a time and follow the keyboard', async () => {
  const page = await openUrl(showcaseUrl);
  try {
    const state = () =>
      page.page.evaluate(() => ({
        selected: [...document.querySelectorAll('[role="tab"]')].map((tab) => tab.getAttribute('aria-selected')),
        visible: [...document.querySelectorAll('.pairing-panel')].filter((panel) => !panel.hidden).map((panel) => panel.id),
        tabbable: [...document.querySelectorAll('[role="tab"]')].filter((tab) => tab.tabIndex === 0).length,
      }));
    let current = await state();
    assert.equal(current.selected.length, 7);
    assert.deepEqual(current.visible, ['pairing-wood-felt']);
    assert.equal(current.tabbable, 1);
    assert.equal(await page.page.getAttribute('[role="tab"]', 'aria-controls'), 'pairing-wood-felt');

    await page.page.focus('[role="tab"]');
    await page.page.keyboard.press('ArrowRight');
    current = await state();
    assert.deepEqual(current.visible, ['pairing-leather-paper']);
    await page.page.keyboard.press('End');
    assert.deepEqual((await state()).visible, ['pairing-glass']);
    await page.page.keyboard.press('ArrowRight');
    assert.deepEqual((await state()).visible, ['pairing-wood-felt'], 'the last tab does not wrap to the first');
    await page.page.keyboard.press('ArrowLeft');
    assert.deepEqual((await state()).visible, ['pairing-glass'], 'the first tab does not wrap to the last');

    await page.page.locator('[role="tab"]', { hasText: 'Metal and plastic' }).click();
    assert.deepEqual((await state()).visible, ['pairing-metal-plastic']);

    await page.page.locator('[role="tab"]', { hasText: 'Plastic panel' }).click();
    assert.deepEqual((await state()).visible, ['pairing-plastic-panel']);
  } finally {
    await page.close();
  }
});

test('the site text is set in Lato', async () => {
  const page = await openUrl(showcaseUrl);
  try {
    await page.page.evaluate(() => document.fonts.ready);
    const result = await page.page.evaluate(() => ({
      heading: getComputedStyle(document.querySelector('#pairings h2')).fontFamily,
      loaded: document.fonts.check('700 16px Lato'),
    }));
    assert.ok(result.heading.includes('Lato'), result.heading);
    assert.ok(result.loaded, 'Lato did not load from Google Fonts');
  } finally {
    await page.close();
  }
});

test('the home page pairings show the markup that builds them', async () => {
  const page = await openUrl(showcaseUrl);
  try {
    assert.deepEqual(await page.page.evaluate(`(${MISMATCHES_SOURCE})('.pairing-panel')`), []);
    assert.equal(await page.page.locator('.pairing-panel .code-block').count(), 6);
  } finally {
    await page.close();
  }
});

test('the controls page shows each control alone with its variants', async () => {
  const page = await openUrl(showcasePageUrl('controls'));
  try {
    const found = await page.page.evaluate(() => {
      const count = (selector) => document.querySelectorAll(`main ${selector}`).length;
      return {
        sections: [...document.querySelectorAll('section.scene')].map((scene) => scene.id),
        plasticColors: ['red', 'green', 'amber', 'blue', 'purple'].map((color) => count(`.window .fam-plastic--${color}`)),
        roundButtons: count('.window .fam-plastic--round'),
        squareButtons: count('.window .fam-plastic--square'),
        metalButtons: count('.window .fam-metal-button'),
        brushedButtons: count('.window .fam-metal-button--brushed'),
        woodButtons: count('.window .fam-wood-button:not(.fam-wood-button--paneled)'),
        paneledWoodButtons: count('.window .fam-wood-button--paneled'),
        glossyButtons: count('.window .fam-glossy-button'),
        glassButtons: count('.window .fam-glass-button'),
        buttonGroups: count('.window .fam-button-group'),
        radios: count('.window .fam-radio'),
        dials: count('.window .fam-dial'),
        litLeds: count('.window .fam-led--lit'),
        unlitLeds: count('.window .fam-led:not(.fam-led--lit)'),
        engravedLabels: count('.window .fam-led-label:not(.fam-led-label--printed)'),
        printedLabels: count('.window .fam-led-label--printed'),
        plasticPanels: count('.window.fam-plastic-panel'),
        tabStrips: count('.window [role="tablist"]'),
        switches: count('.window .fam-switch'),
        disabledSwitches: count('.window .fam-switch input:disabled'),
        knobs: count('.window .fam-knob'),
        fills: ['candy', 'aqua', 'green'].map((fill) => count(`.window .fam-progress-fill--${fill}`)),
        selects: count('.window select.fam-glass-input'),
        menus: count('.window .fam-menu'),
        searches: count('.window .fam-field--pill'),
        selectedRows: count('.window .fam-list-row[aria-current="true"]'),
        zebraBoxes: count('.window .fam-table-box'),
        lightInkBoxes: count('.window .fam-table-box--light-ink'),
        zebraGrids: count('.window .fam-table[role="grid"]'),
        recessedRows: count('.window .fam-field-row'),
        leatherButtons: count('.window .fam-leather-button'),
        disabledControls: count('.window :disabled'),
      };
    });
    assert.deepEqual(found.sections, ['scene-buttons', 'scene-radios', 'scene-tabs', 'scene-knobs', 'scene-switches', 'scene-leds', 'scene-progress', 'scene-fields', 'scene-lists', 'scene-focus']);
    assert.ok(found.zebraBoxes >= 3 && found.lightInkBoxes >= 1 && found.zebraGrids >= 1, 'the zebra tables scene is missing a table, the light ink one or the selectable one');
    assert.ok(found.plasticColors.every((total) => total >= 1), 'a plastic color is missing');
    assert.ok(found.roundButtons >= 1 && found.squareButtons >= 1 && found.metalButtons >= 3 && found.glossyButtons >= 3 && found.glassButtons >= 2 && found.buttonGroups >= 5 && found.radios >= 12 && found.dials >= 3 && found.plasticPanels >= 2 && found.tabStrips >= 6 && found.knobs >= 3 && found.switches >= 3 && found.disabledSwitches >= 1);
    assert.ok(found.litLeds >= 2 && found.unlitLeds >= 2 && found.engravedLabels >= 2 && found.printedLabels >= 2, 'the LEDs scene is missing a state or a label style');
    assert.deepEqual(found.fills, [1, 1, 1]);
    assert.ok(found.selects >= 1 && found.menus >= 1 && found.searches >= 1 && found.selectedRows === 1);
    assert.ok(found.recessedRows >= 2 && found.leatherButtons >= 2);
    assert.ok(found.brushedButtons >= 3, 'the brushed metal buttons are missing');
    assert.ok(found.woodButtons >= 4 && found.paneledWoodButtons >= 4, 'the wooden buttons are missing');
    assert.ok(found.disabledControls >= 6, 'the disabled looks are missing');
  } finally {
    await page.close();
  }
});

test('the progress tubes sit on metal on the controls page', async () => {
  const page = await openUrl(showcasePageUrl('controls'));
  try {
    const classes = await page.page.$eval('#scene-progress .window', (window) => [...window.classList]);
    assert.ok(classes.includes('fam-metal-brushed') && !classes.includes('fam-felt'), classes.join(' '));
  } finally {
    await page.close();
  }
});

test('the tab demos switch panels with the arrow keys and show one panel each', async () => {
  const page = await openUrl(showcasePageUrl('controls'));
  try {
    await page.page.locator('#silver-tab-0').focus();
    await page.page.keyboard.press('ArrowRight');
    assert.equal(await page.page.getAttribute('#silver-tab-1', 'aria-selected'), 'true');
    assert.equal(await page.page.getAttribute('#silver-tab-0', 'aria-selected'), 'false');
    assert.equal(await page.page.evaluate(() => document.activeElement.id), 'silver-tab-1');
    await page.page.keyboard.press('ArrowRight');
    assert.equal(await page.page.evaluate(() => document.activeElement.id), 'silver-tab-0', 'the arrow keys land on the disabled tab');
    const visible = await page.page.evaluate(() => [...document.querySelectorAll('[role="tablist"][data-tabs]')].map((strip) => [...strip.parentElement.querySelectorAll('[role="tabpanel"]')].filter((panel) => !panel.hidden).length));
    assert.ok(visible.length >= 6 && visible.every((count) => count === 1), visible.join(','));
  } finally {
    await page.close();
  }
});

test('tab strips fit a phone screen', async () => {
  const page = await openUrl(showcasePageUrl('controls'), { viewport: { width: 375, height: 800 } });
  try {
    const rights = await page.page.evaluate(() => [...document.querySelectorAll('.window [role="tablist"]')].map((strip) => strip.getBoundingClientRect().right));
    assert.ok(rights.every((right) => right <= 375), rights.join(','));
  } finally {
    await page.close();
  }
});

test('the site bar fits a phone screen on every page', async () => {
  for (const pageName of PAGE_NAMES) {
    const page = await openUrl(showcasePageUrl(pageName), { viewport: { width: 375, height: 800 } });
    try {
      const overflow = await page.page.evaluate(() =>
        [...document.querySelectorAll('.site-nav a')]
          .filter((link) => link.getBoundingClientRect().width > 0)
          .filter((link) => link.getBoundingClientRect().right > window.innerWidth)
          .map((link) => link.textContent),
      );
      assert.deepEqual(overflow, [], `${pageName}: these site bar items run off a 375px screen`);
      assert.ok(await page.page.evaluate(() => getComputedStyle(document.querySelector('.site-nav-home')).display === 'none'), 'Home should give way to the brand link on a phone');
    } finally {
      await page.close();
    }
  }
});

const ZEBRA_ROWS = '#scene-lists table[role="grid"] tbody tr';

const selectedRowIndexes = (page) => page.evaluate((selector) => [...document.querySelectorAll(selector)].flatMap((row, index) => (row.getAttribute('aria-selected') === 'true' ? [index] : [])), ZEBRA_ROWS);
const focusedRowIndex = (page) => page.evaluate((selector) => [...document.querySelectorAll(selector)].indexOf(document.activeElement), ZEBRA_ROWS);

test('clicking a zebra row selects only that row', async () => {
  const page = await openUrl(showcasePageUrl('controls'));
  try {
    await page.page.locator(ZEBRA_ROWS).nth(4).click();
    assert.deepEqual(await selectedRowIndexes(page.page), [4]);
    await page.page.locator(ZEBRA_ROWS).nth(1).click();
    assert.deepEqual(await selectedRowIndexes(page.page), [1]);
  } finally {
    await page.close();
  }
});

test('arrow keys move the zebra selection and Home and End jump', async () => {
  const page = await openUrl(showcasePageUrl('controls'));
  try {
    const rowCount = await page.page.locator(ZEBRA_ROWS).count();
    await page.page.locator(ZEBRA_ROWS).nth(2).focus();
    await page.page.keyboard.press('ArrowDown');
    assert.deepEqual(await selectedRowIndexes(page.page), [3]);
    assert.equal(await focusedRowIndex(page.page), 3, 'focus did not follow the selection');
    await page.page.keyboard.press('ArrowUp');
    await page.page.keyboard.press('ArrowUp');
    await page.page.keyboard.press('ArrowUp');
    assert.deepEqual(await selectedRowIndexes(page.page), [0], 'the selection wrapped or moved past the first row');
    await page.page.keyboard.press('End');
    assert.deepEqual(await selectedRowIndexes(page.page), [rowCount - 1]);
    await page.page.keyboard.press('ArrowDown');
    assert.deepEqual(await selectedRowIndexes(page.page), [rowCount - 1], 'the selection wrapped past the last row');
    await page.page.keyboard.press('Home');
    assert.deepEqual(await selectedRowIndexes(page.page), [0]);
  } finally {
    await page.close();
  }
});

test('only the selected zebra row is in the Tab order', async () => {
  const page = await openUrl(showcasePageUrl('controls'));
  try {
    const tabbable = () => page.page.evaluate((selector) => [...document.querySelectorAll(selector)].flatMap((row, index) => (row.tabIndex === 0 ? [index] : [])), ZEBRA_ROWS);
    assert.deepEqual(await tabbable(), await selectedRowIndexes(page.page));
    await page.page.locator(ZEBRA_ROWS).nth(5).click();
    assert.deepEqual(await tabbable(), [5]);
  } finally {
    await page.close();
  }
});

test('a zebra row reached with the keyboard is not hidden under the sticky header', async () => {
  const page = await openUrl(showcasePageUrl('controls'));
  try {
    const clearance = () => page.page.evaluate(() => {
      const grid = document.querySelector('#scene-lists table[role="grid"]');
      return document.activeElement.getBoundingClientRect().top - grid.querySelector('th').getBoundingClientRect().bottom;
    });
    const lastIndex = (await page.page.locator(ZEBRA_ROWS).count()) - 1;
    await page.page.locator(ZEBRA_ROWS).nth(2).focus();
    await page.page.keyboard.press('End');
    for (let step = 0; step < 9; step += 1) {
      await page.page.keyboard.press('ArrowUp');
      assert.equal(await focusedRowIndex(page.page), lastIndex - step - 1, 'focus did not move up a row');
      assert.ok(await clearance() >= -0.5, `a row is under the header after ${step + 1} presses up`);
    }
    await page.page.keyboard.press('End');
    await page.page.keyboard.press('Home');
    assert.ok(await clearance() >= -0.5, 'the first row is under the header');
  } finally {
    await page.close();
  }
});

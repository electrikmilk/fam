import { execFile } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { closeSharedBrowser, exampleUrl, openUrl, showcasePageUrl } from '../tests/helpers/browser.mjs';

const execFileAsync = promisify(execFile);
const SHOWCASE_PAGE_FILES = { showcase: 'index', 'showcase-pairings': 'pairings', 'showcase-materials': 'materials', 'showcase-controls': 'controls', 'showcase-glass': 'glass', 'showcase-examples': 'examples' };
const AUDITED_PAGES = ['controls', 'notes', 'sign-in', ...Object.keys(SHOWCASE_PAGE_FILES)];

// The showcase pages are not example pages, so they have their own location
const urlFor = (pageName) => (pageName in SHOWCASE_PAGE_FILES ? showcasePageUrl(SHOWCASE_PAGE_FILES[pageName]) : exampleUrl(pageName));
const collectScript = fileURLToPath(new URL('contrast-audit/collect.js', import.meta.url));
const measureScript = fileURLToPath(new URL('contrast-audit/measure.py', import.meta.url));

// Chrome cannot screenshot more than 16384 device pixels in one image, and the audit runs at a device pixel ratio of 2.
// A taller page is measured in slices that overlap, so every item lies fully inside at least one slice.
const SLICE_HEIGHT = 7000;
const SLICE_OVERLAP = 300;

function slicesFor(pageHeight) {
  const slices = [];
  for (let top = 0; top < pageHeight; top += SLICE_HEIGHT) {
    slices.push({ top, height: Math.min(SLICE_HEIGHT + SLICE_OVERLAP, pageHeight - top) });
  }
  return slices;
}

async function measureSlice(page, { width, top, height }, items, directory, index) {
  const itemsPath = join(directory, `items-${index}.json`);
  const screenshotPath = join(directory, `page-${index}.png`);
  const resultsPath = join(directory, `results-${index}.json`);
  await writeFile(itemsPath, JSON.stringify({ items: items.map((item) => ({ ...item, y: item.y - top })) }));
  await page.screenshot({ path: screenshotPath, fullPage: true, clip: { x: 0, y: top, width, height } });
  await execFileAsync('python3', ['-I', measureScript, itemsPath, screenshotPath, resultsPath]);
  return JSON.parse(await readFile(resultsPath, 'utf8'));
}

// measure.py maps page coordinates to screenshot pixels with a device pixel ratio of 2
export async function runAudit(pageName, { width = 1440 } = {}) {
  const collectSource = await readFile(collectScript, 'utf8');
  const example = await openUrl(urlFor(pageName), { viewport: { width, height: 900 }, deviceScaleFactor: 2 });
  try {
    const collected = await example.page.evaluate(`(${collectSource})()`);
    const directory = await mkdtemp(join(tmpdir(), 'fam-audit-'));
    const pageHeight = await example.page.evaluate(() => document.documentElement.scrollHeight);
    const claimed = new Set();
    let measured = 0;
    const failures = [];
    const slices = slicesFor(pageHeight);
    for (const [index, slice] of slices.entries()) {
      const inside = collected.items.filter((item) => !claimed.has(item) && item.y >= slice.top && item.y + item.h <= slice.top + slice.height);
      for (const item of inside) claimed.add(item);
      if (inside.length === 0) continue;
      const result = await measureSlice(example.page, { width, ...slice }, inside, directory, index);
      measured += result.measured;
      failures.push(...result.failures);
    }
    const unmeasured = collected.items.length - claimed.size;
    if (unmeasured > 0) throw new Error(`${pageName}: ${unmeasured} items straddle a slice boundary and were not measured`);
    return { measured, failures };
  } finally {
    await example.close();
  }
}

if (import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  let failed = false;
  try {
    for (const pageName of AUDITED_PAGES) {
      const { measured, failures } = await runAudit(pageName);
      console.log(`${pageName}: ${measured} items measured, ${failures.length} below threshold`);
      for (const failure of failures) {
        console.log(`  ${failure.kind} "${failure.text}" in ${failure.sel}: worst ${failure.worst.toFixed(2)}, needs ${failure.needed}`);
      }
      failed ||= failures.length > 0;
    }
  } finally {
    await closeSharedBrowser();
  }
  process.exitCode = failed ? 1 : 0;
}

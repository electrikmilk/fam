import { execFile } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { closeSharedBrowser, exampleUrl, openUrl } from '../tests/helpers/browser.mjs';

const execFileAsync = promisify(execFile);
const EXAMPLE_PAGES =['controls', 'notes', 'sign-in'];
const collectScript = fileURLToPath(new URL('contrast-audit/collect.js', import.meta.url));
const measureScript = fileURLToPath(new URL('contrast-audit/measure.py', import.meta.url));

// measure.py maps page coordinates to screenshot pixels with a device pixel ratio of 2
export async function runAudit(pageName, { width = 1440 } = {}) {
  const collectSource = await readFile(collectScript, 'utf8');
  const example = await openUrl(exampleUrl(pageName), { viewport: { width, height: 900 }, deviceScaleFactor: 2 });
  try {
    const collected = await example.page.evaluate(`(${collectSource})()`);
    const directory = await mkdtemp(join(tmpdir(), 'fam-audit-'));
    const itemsPath = join(directory, 'items.json');
    const screenshotPath = join(directory, 'page.png');
    const resultsPath = join(directory, 'results.json');
    await writeFile(itemsPath, JSON.stringify(collected));
    await example.page.screenshot({ path: screenshotPath, fullPage: true });
    await execFileAsync('python3', ['-I', measureScript, itemsPath, screenshotPath, resultsPath]);
    return JSON.parse(await readFile(resultsPath, 'utf8'));
  } finally {
    await example.close();
  }
}

if (import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  let failed = false;
  try {
    for (const pageName of EXAMPLE_PAGES) {
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

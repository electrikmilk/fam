import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium, firefox, webkit } from 'playwright-core';

const testsRoot = new URL('../', import.meta.url);

// FAM_BROWSER selects the engine: chrome (default, the installed Google Chrome), firefox or webkit
const ENGINE = process.env.FAM_BROWSER ?? 'chrome';
export const isChromium = ENGINE === 'chrome';

function launchEngine() {
  if (ENGINE === 'chrome') return chromium.launch({ channel: 'chrome' });
  if (ENGINE === 'firefox') return firefox.launch();
  if (ENGINE === 'webkit') return webkit.launch();
  throw new Error(`FAM_BROWSER must be chrome, firefox or webkit, got "${ENGINE}"`);
}

// One browser per test file: launching Chrome costs about as much as the page checks themselves.
// Each test still gets its own context, so viewport, motion and color settings stay isolated.
let sharedBrowser;
const sharedBrowserForThisFile = () => (sharedBrowser ??= launchEngine());
export async function closeSharedBrowser() {
  if (sharedBrowser) await (await sharedBrowser).close();
  sharedBrowser = undefined;
}
// Scripts that use openUrl outside the test runner must call closeSharedBrowser themselves, or the open browser keeps the process alive.
// The hook is registered only under the runner, because importing node:test elsewhere makes it print an empty test summary.
if (process.env.NODE_TEST_CONTEXT) {
  const { after } = await import('node:test');
  after(closeSharedBrowser);
}

export const fixtureUrl = (name) => pathToFileURL(fileURLToPath(new URL(`fixtures/${name}.html`, testsRoot))).href;
export const exampleUrl = (name) => pathToFileURL(fileURLToPath(new URL(`../examples/${name}.html`, testsRoot))).href;

export async function openUrl(
  url,
  { viewport = { width: 1440, height: 900 }, deviceScaleFactor = 1, reducedMotion = 'no-preference', forcedColors = 'none' } = {},
) {
  const browser = await sharedBrowserForThisFile();
  const context = await browser.newContext({ viewport, deviceScaleFactor, reducedMotion, forcedColors });
  const page = await context.newPage();

  const issues = [];
  let imageBytesPending = [];
  page.on('requestfailed', (request) => issues.push(`request failed: ${request.url()} ${request.failure()?.errorText}`));
  page.on('response', (response) => {
    if (response.status() >= 400) issues.push(`HTTP ${response.status()}: ${response.url()}`);
    if (response.request().resourceType() === 'image') imageBytesPending.push(response.body().then((body) => body.length));
  });
  page.on('console', (message) => {
    if (message.type() === 'error') issues.push(`console error: ${message.text()}`);
  });

  try {
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForLoadState('networkidle');
  } catch (error) {
    await context.close();
    throw error;
  }

  return {
    page,
    issues,
    imageBytes: async () => (await Promise.all(imageBytesPending)).reduce((sum, bytes) => sum + bytes, 0),
    close: () => context.close(),
  };
}

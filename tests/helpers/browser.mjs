import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

const testsRoot = new URL('../', import.meta.url);

export const fixtureUrl = (name) => pathToFileURL(fileURLToPath(new URL(`fixtures/${name}.html`, testsRoot))).href;
export const exampleUrl = (name) => pathToFileURL(fileURLToPath(new URL(`../examples/${name}.html`, testsRoot))).href;

export async function openUrl(
  url,
  { viewport = { width: 1440, height: 900 }, deviceScaleFactor = 1, reducedMotion = 'no-preference' } = {},
) {
  const browser = await chromium.launch({ channel: 'chrome' });
  const context = await browser.newContext({ viewport, deviceScaleFactor, reducedMotion });
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
    await browser.close();
    throw error;
  }

  return {
    page,
    issues,
    imageBytes: async () => (await Promise.all(imageBytesPending)).reduce((sum, bytes) => sum + bytes, 0),
    close: () => browser.close(),
  };
}

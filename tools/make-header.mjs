import { mkdir } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { closeSharedBrowser, openUrl, showcaseUrl } from '../tests/helpers/browser.mjs';

// Renders the showcase's opening screen as a banner for the README. Run it after `npm run build`.
const WIDTH = 1280;
const HEIGHT = 400;
const outputPath = fileURLToPath(new URL('../docs/header.png', import.meta.url));

export async function makeHeader() {
  const page = await openUrl(showcaseUrl, { viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 2 });
  try {
    // The hero is 78% of the viewport on the page; the banner is a fixed height. A transparent page leaves the frame's rounded corners clear on any background.
    await page.page.addStyleTag({ content: `#hero { min-height: ${HEIGHT}px; } html, body { background: transparent; }` });
    await mkdir(fileURLToPath(new URL('../docs/', import.meta.url)), { recursive: true });
    await page.page.locator('#hero').screenshot({ path: outputPath, omitBackground: true });
    return outputPath;
  } finally {
    await page.close();
  }
}

if (import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  try {
    console.log(await makeHeader());
  } finally {
    await closeSharedBrowser();
  }
}

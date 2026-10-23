import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { buildSite } from '../tools/build-site.mjs';
import { openUrl } from './helpers/browser.mjs';

const repoFile = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

async function assembledSite() {
  const directory = await mkdtemp(join(tmpdir(), 'fam-site-'));
  await buildSite(directory);
  return directory;
}

test('the assembled site works from its own folder', async () => {
  const directory = await assembledSite();
  const page = await openUrl(pathToFileURL(join(directory, 'showcase/index.html')).href);
  try {
    assert.deepEqual(page.issues, []);
    const texture = await page.page.evaluate(() => getComputedStyle(document.querySelector('.fam-felt')).backgroundImage);
    assert.ok(texture.includes('/assets/felt-gray-tile.jpg'), texture);
  } finally {
    await page.close();
  }
});

test('the site root redirects to the showcase', async () => {
  const root = await readFile(join(await assembledSite(), 'index.html'), 'utf8');
  assert.ok(root.includes('url=showcase/'), root);
  assert.ok(root.includes('href="showcase/"'), 'the redirect page has no link for visitors whose browser ignores it');
});

test('the site holds only what the page needs', async () => {
  assert.deepEqual((await readdir(await assembledSite())).sort(), ['assets', 'dist', 'examples', 'index.html', 'showcase', 'snippets']);
});

// The site is served under /fam/, so a URL that starts with a slash would point at the wrong place
test('the page, its stylesheet and its scripts use only relative URLs', async () => {
  const files = ['index.html', 'materials.html', 'controls.html', 'glass.html', 'examples.html', 'showcase.css', 'site.css', 'copy.js', 'knob.js', 'lens.js', 'main.js', 'site.js'];
  for (const name of files) {
    const text = await repoFile(`showcase/${name}`);
    assert.ok(!/(?:src|href|action)=["']\/(?!\/)/.test(text), `${name} has an attribute URL that starts with a slash`);
    assert.ok(!/url\(\s*["']?\//.test(text), `${name} has a CSS url() that starts with a slash`);
    assert.ok(!/fetch\(\s*["']\//.test(text), `${name} fetches a path that starts with a slash`);
  }
});

const SHOWCASE_PAGES = ['index', 'materials', 'controls', 'glass', 'examples'];
const SITE_NAV_LABELS = ['Home', 'Materials', 'Controls', 'Glass', 'Examples'];

test('every page carries the same site bar with its own page marked current', async () => {
  for (const [position, name] of SHOWCASE_PAGES.entries()) {
    const html = await repoFile(`showcase/${name}.html`);
    const items = [...html.matchAll(/<a class="fam-nav-item[^"]*" href="([^"]+)"( aria-current="page")?>([^<]+)<\/a>/g)];
    assert.deepEqual(items.map((item) => item[3]), SITE_NAV_LABELS, `${name}.html has a different site bar`);
    assert.deepEqual(items.filter((item) => item[2]).map((item) => item[3]), [SITE_NAV_LABELS[position]], `${name}.html marks the wrong page current`);
  }
});

test('every link between pages in the assembled site reaches a file', async () => {
  const directory = await assembledSite();
  for (const name of SHOWCASE_PAGES) {
    // Code samples quote links to files that belong to the reader's page, not this one
    const html = (await readFile(join(directory, 'showcase', `${name}.html`), 'utf8')).replace(/<pre>[\s\S]*?<\/pre>/g, '');
    const targets = [...html.matchAll(/(?:href|src)="([^"#:]+)(?:#[^"]*)?"/g)].map((match) => match[1]);
    for (const target of targets) {
      await access(join(directory, 'showcase', target)).catch(() => assert.fail(`${name}.html links to ${target}, which the assembled site does not contain`));
    }
  }
});

test('the workflow publishes the built site to GitHub Pages', async () => {
  const workflow = await repoFile('.github/workflows/pages.yml');
  for (const expected of ['npm run site', 'actions/upload-pages-artifact@', 'actions/deploy-pages@', 'pages: write', 'id-token: write', 'contents: read', 'github-pages']) {
    assert.ok(workflow.includes(expected), `the workflow does not contain "${expected}"`);
  }
  assert.match(workflow, /on:\s*\n\s+push:\s*\n\s+branches:\s*\[main\]/, 'the workflow does not run on pushes to main');
  assert.ok((await repoFile('.gitignore')).split('\n').includes('_site/'), '_site/ is not ignored');
  assert.equal(JSON.parse(await repoFile('package.json')).scripts.site, 'npm run build && node tools/build-site.mjs');
});

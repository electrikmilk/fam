import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import test from 'node:test';
import { gzipSync } from 'node:zlib';
import { exampleUrl, openUrl, showcaseUrl } from './helpers/browser.mjs';

const repoFile = (path) => new URL(`../${path}`, import.meta.url);
const kilobytes = (bytes) => Math.round(bytes / 1000);

async function tileSizes() {
  const names = (await readdir(repoFile('assets'))).filter((name) => name.endsWith('-tile.jpg'));
  return Promise.all(names.map(async (name) => (await stat(repoFile(`assets/${name}`))).size));
}

// The numbers the showcase and the README quote about weight, recomputed from the real files so they cannot drift
async function expectedClaims() {
  const sizes = await tileSizes();
  const css = await readFile(repoFile('dist/fam-ui.css'));
  const notes = await openUrl(exampleUrl('notes'));
  try {
    return {
      'tile-min': `${kilobytes(Math.min(...sizes))} KB`,
      'tile-max': `${kilobytes(Math.max(...sizes))} KB`,
      css: `${kilobytes(css.length)} KB`,
      'css-gzip': `${(gzipSync(css).length / 1000).toFixed(1)} KB`,
      'notes-images': `${kilobytes(await notes.imageBytes())} KB`,
    };
  } finally {
    await notes.close();
  }
}

test('the weight numbers on the home page match the files', async () => {
  const expected = await expectedClaims();
  const page = await openUrl(showcaseUrl);
  try {
    const claims = await page.page.$$eval('[data-claim]', (elements) => elements.map((element) => [element.dataset.claim, element.textContent.trim()]));
    const quoted = new Map(claims);
    for (const [name, text] of Object.entries(expected)) assert.equal(quoted.get(name), text, `the home page quotes the wrong ${name}`);
    for (const [name, text] of claims.filter(([claim]) => claim.startsWith('tile:'))) {
      const { size } = await stat(repoFile(`assets/${name.slice('tile:'.length)}`));
      assert.equal(text, `${kilobytes(size)} KB`, `${name} is quoted wrong`);
    }
  } finally {
    await page.close();
  }
});

test('the README quotes the same weight numbers', async () => {
  const readme = await readFile(repoFile('README.md'), 'utf8');
  for (const [name, text] of Object.entries(await expectedClaims())) assert.ok(readme.includes(text), `the README does not quote ${text} for ${name}`);
});

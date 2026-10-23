import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { openUrl } from './helpers/browser.mjs';
import { statistics } from './helpers/pixels.mjs';

const packageRoot = fileURLToPath(new URL('../', import.meta.url));
const packageFiles = () =>
  JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { cwd: packageRoot, encoding: 'utf8' }))[0].files.map((file) => file.path);

test('tarball contains only what ships', async () => {
  const files = packageFiles();
  const required = ['dist/fam-ui.css', 'snippets/refraction-filter.html', 'snippets/refraction-round.js', 'README.md', 'CREDITS.md', 'package.json'];
  for (const name of [...required, ...(await readdir(join(packageRoot, 'css'))).map((file) => `css/${file}`), ...(await readdir(join(packageRoot, 'assets'))).map((file) => `assets/${file}`)]) {
    assert.ok(files.includes(name), `${name} is missing from the tarball`);
  }
  const unexpected = files.filter((file) => /^(tools|tests|textures|docs|references|examples|node_modules)\//.test(file));
  assert.deepEqual(unexpected, []);
});

test('README only names classes and variables that exist', async () => {
  const [readme, css] = await Promise.all([readFile(join(packageRoot, 'README.md'), 'utf8'), readFile(join(packageRoot, 'dist/fam-ui.css'), 'utf8')]);
  const classNames = new Set([...readme.matchAll(/(?<![-\w])(fam-(?!ui\b)[a-z0-9]+(?:-[a-z0-9]+)*)/g)].map((match) => match[1]));
  assert.ok(classNames.size > 20, 'the README documents too few classes');
  for (const name of classNames) assert.ok(css.includes(`.${name}`), `README names .${name} but the CSS does not define it`);
  assert.ok(!readme.includes('role="option" tabindex'), 'the README must not teach a listbox with per-option tab stops');
  const variables = new Set([...readme.matchAll(/--fam-[a-z0-9-]+/g)].map((match) => match[0]));
  for (const name of variables) assert.ok(css.includes(name), `README names ${name} but the CSS does not use it`);
});

async function installIntoConsumer() {
  const workspace = await mkdtemp(join(tmpdir(), 'fam-consumer-'));
  execFileSync('npm', ['pack', '--pack-destination', workspace], { cwd: packageRoot, stdio: 'pipe' });
  const tarball = join(workspace, (await readdir(workspace)).find((file) => file.endsWith('.tgz')));
  const project = join(workspace, 'project');
  await mkdir(join(project, 'site/pages'), { recursive: true });
  await writeFile(join(project, 'package.json'), JSON.stringify({ name: 'consumer', version: '1.0.0', private: true }));
  execFileSync('npm', ['install', '--no-audit', '--no-fund', tarball], { cwd: project, stdio: 'pipe' });
  // The page and the stylesheet sit in different folders, so the textures must resolve against the stylesheet
  await writeFile(
    join(project, 'site/pages/index.html'),
    `<!doctype html><link rel="stylesheet" href="../../node_modules/fam-ui/dist/fam-ui.css">
<body style="margin:0">
<div id="felt" class="fam-felt" style="width:120px;height:80px"></div>
<div id="felt-burgundy" class="fam-felt" style="--fam-tint:#8a1f2b;width:120px;height:80px"></div>
<div id="wood" class="fam-wood" style="width:120px;height:80px"></div>
<div id="frame" class="fam-leather-frame" style="width:200px;height:140px"></div>
</body>`,
  );
  return { pageUrl: pathToFileURL(join(project, 'site/pages/index.html')).href, project };
}

test('works when installed in a project with the page in another directory', async () => {
  const { pageUrl } = await installIntoConsumer();
  const page = await openUrl(pageUrl);
  try {
    assert.deepEqual(page.issues, []);
    const sources = await page.page.evaluate(() => ({
      felt: getComputedStyle(document.getElementById('felt')).backgroundImage,
      wood: getComputedStyle(document.getElementById('wood')).backgroundImage,
      frame: getComputedStyle(document.getElementById('frame')).borderImageSource,
    }));
    assert.ok(sources.felt.includes('/node_modules/fam-ui/assets/felt-gray-tile.jpg'), sources.felt);
    assert.ok(sources.wood.includes('/node_modules/fam-ui/assets/wood-light-tile.jpg'), sources.wood);
    assert.ok(sources.frame.includes('/node_modules/fam-ui/assets/leather-frame-tan-soft.png'), sources.frame);
  } finally {
    await page.close();
  }
});

test('an inline --fam-tint still recolors the felt', async () => {
  const { pageUrl } = await installIntoConsumer();
  const page = await openUrl(pageUrl);
  try {
    const green = statistics(await page.page.locator('#felt').screenshot());
    const burgundy = statistics(await page.page.locator('#felt-burgundy').screenshot());
    assert.ok(green.mean[1] > green.mean[0], 'the default felt is not green');
    assert.ok(burgundy.mean[0] > burgundy.mean[1], 'the burgundy tint did not apply');
  } finally {
    await page.close();
  }
});

test('a bare import of the package resolves to the bundle', async () => {
  const { project } = await installIntoConsumer();
  const resolved = execFileSync('node', ['--input-type=module', '-e', "console.log(import.meta.resolve('fam-ui'))"], { cwd: project, encoding: 'utf8' }).trim();
  assert.ok(resolved.endsWith('/node_modules/fam-ui/dist/fam-ui.css'), resolved);
});

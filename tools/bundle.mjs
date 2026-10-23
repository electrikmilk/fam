import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const LAYERS = ['tokens', 'materials', 'effects', 'components', 'templates'];

const packageRoot = new URL('../', import.meta.url);

export async function buildBundle() {
  const layerTexts = await Promise.all(
    LAYERS.map((layer) => readFile(new URL(`css/${layer}.css`, packageRoot), 'utf8')),
  );
  const bundlePath = fileURLToPath(new URL('dist/fam-ui.css', packageRoot));
  await mkdir(fileURLToPath(new URL('dist/', packageRoot)), { recursive: true });
  await writeFile(bundlePath, layerTexts.join('\n'));
  return bundlePath;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(await buildBundle());
}

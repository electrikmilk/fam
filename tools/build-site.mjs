import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Assembles the folder GitHub Pages publishes. It keeps the repository's own layout (showcase/, examples/, dist/, assets/) so the pages'
// relative links to ../dist/fam-ui.css and ../assets/ work unchanged, and adds a root page that sends visitors to the showcase.
const packageRoot = new URL('../', import.meta.url);
const COPIED_FOLDERS = ['showcase', 'examples', 'dist', 'assets'];

const REDIRECT_PAGE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>fam-ui</title>
  <meta http-equiv="refresh" content="0; url=showcase/">
</head>
<body>
  <p><a href="showcase/">Open the fam-ui showcase</a></p>
</body>
</html>
`;

export async function buildSite(outputDirectory) {
  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(outputDirectory, { recursive: true });
  for (const folder of COPIED_FOLDERS) {
    await cp(fileURLToPath(new URL(`${folder}/`, packageRoot)), join(outputDirectory, folder), { recursive: true });
  }
  await writeFile(join(outputDirectory, 'index.html'), REDIRECT_PAGE);
  return outputDirectory;
}

if (import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  console.log(await buildSite(fileURLToPath(new URL('_site/', packageRoot))));
}

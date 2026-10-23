import { realpathSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Red and green edge ramps that are neutral (128) across the middle 60% of the lens, so only the rim bends the backdrop
const RAMP_STOPS = [
  [0, 255],
  [0.04, 215],
  [0.1, 160],
  [0.2, 128],
  [0.8, 128],
  [0.9, 96],
  [0.96, 40],
  [1, 0],
];

function edgeGradient(channel) {
  const horizontal = channel === 'x';
  const color = (level) => (horizontal ? `rgb(${level},0,0)` : `rgb(0,${level},0)`);
  const stops = RAMP_STOPS.map(([offset, level]) => `<stop offset='${offset}' stop-color='${color(level)}'/>`).join('');
  return `<linearGradient id='${channel}' x1='0' x2='${horizontal ? 1 : 0}' y1='0' y2='${horizontal ? 0 : 1}'>${stops}</linearGradient>`;
}

export function buildDisplacementMapSvg() {
  return (
    "<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' preserveAspectRatio='none'>" +
    `<defs>${edgeGradient('x')}${edgeGradient('y')}</defs>` +
    "<rect width='100' height='100' fill='black'/>" +
    "<rect width='100' height='100' fill='url(#x)'/>" +
    "<rect width='100' height='100' fill='url(#y)' style='mix-blend-mode:screen'/></svg>"
  );
}

export function buildSnippet() {
  const href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildDisplacementMapSvg())}`;
  return `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <filter id="fam-refract" x="0" y="0" width="1" height="1" primitiveUnits="objectBoundingBox" color-interpolation-filters="sRGB">
    <feImage x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="map" href="${href}"/>
    <feDisplacementMap in="SourceGraphic" in2="map" scale="0.2" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</svg>
`;
}

if (import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const snippetPath = fileURLToPath(new URL('../snippets/refraction-filter.html', import.meta.url));
  await mkdir(fileURLToPath(new URL('../snippets/', import.meta.url)), { recursive: true });
  await writeFile(snippetPath, buildSnippet());
  console.log(snippetPath);
}

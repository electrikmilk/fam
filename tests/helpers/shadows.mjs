const LAYER_PATTERN = /^rgba?\(([^)]*)\)\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px$/;

// Reads the outer layers of a computed box-shadow, which every engine serializes as "color x y blur spread" per layer.
// Inset layers are skipped because they shade the element itself, not the surface under it.
export function parseBoxShadow(computedBoxShadow) {
  if (computedBoxShadow === 'none') return [];
  return computedBoxShadow
    .split(/,\s*(?=rgba?\()/)
    .filter((layer) => !layer.includes('inset'))
    .map((layer) => {
      const match = LAYER_PATTERN.exec(layer.trim());
      if (!match) throw new Error(`cannot read the shadow layer "${layer}" of "${computedBoxShadow}"`);
      const channels = match[1].split(',').map((channel) => Number(channel.trim()));
      return { alpha: channels[3] ?? 1, offsetY: Number(match[3]), blur: Number(match[4]), spread: Number(match[5]) };
    });
}

// How far below the element the farthest layer reaches; a negative spread shortens it
export const reachOf = (layers) => Math.max(...layers.map((layer) => layer.offsetY + layer.blur + layer.spread));

export const totalAlphaOf = (layers) => layers.reduce((total, layer) => total + layer.alpha, 0);

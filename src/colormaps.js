import { CmoceanColormaps } from './cmocean.js';
import {
  interpolateViridis,
  interpolatePlasma,
  interpolateInferno,
  interpolateMagma,
  interpolateRdYlBu,
  interpolateRdBu,
  interpolateSpectral,
  interpolateBuPu,
  interpolateYlGnBu,
  interpolatePuBuGn,
  interpolateOrRd,
  interpolateBlues,
  interpolateGreens,
  interpolateGreys,
  interpolateYlOrRd,
} from 'd3-scale-chromatic';

function parseRgb(str) {
  const m = str.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (m) return [+m[1], +m[2], +m[3]];
  const hex = str.replace('#', '');
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
}

// Wrap a d3 interpolator into (t: 0-1) => [r, g, b]
function wrap(fn) {
  return t => parseRgb(fn(Math.max(0, Math.min(1, t))));
}

function wrapR(fn) {
  return t => parseRgb(fn(1 - Math.max(0, Math.min(1, t))));
}

export const Colormaps = {
  // Perceptually uniform sequential
  viridis:   wrap(interpolateViridis),
  plasma:    wrap(interpolatePlasma),
  inferno:   wrap(interpolateInferno),
  magma:     wrap(interpolateMagma),

  // Diverging — most useful for anomalies
  RdYlBu:    wrap(interpolateRdYlBu),
  RdYlBu_r:  wrapR(interpolateRdYlBu),  // warm=red, cold=blue (standard temp anomaly)
  RdBu:      wrap(interpolateRdBu),
  RdBu_r:    wrapR(interpolateRdBu),
  Spectral:  wrap(interpolateSpectral),
  Spectral_r: wrapR(interpolateSpectral),

  // Sequential multi-hue
  BuPu:     wrap(interpolateBuPu),
  YlGnBu:   wrap(interpolateYlGnBu),   // good for precip
  PuBuGn:   wrap(interpolatePuBuGn),   // good for SST
  OrRd:     wrap(interpolateOrRd),
  YlOrRd:   wrap(interpolateYlOrRd),
  Blues:    wrap(interpolateBlues),
  Greens:   wrap(interpolateGreens),
  Greys:    wrap(interpolateGreys),    // cloud cover, wind speed
};

// Allow string lookup: Colormaps['viridis'] or Colormaps.viridis
export function resolveColormap(cmap) {
  if (typeof cmap === 'function') return cmap;
  if (typeof cmap === 'string') {
    if (Colormaps[cmap]) return Colormaps[cmap];
    if (CmoceanColormaps[cmap]) return CmoceanColormaps[cmap];
    const all = [...Object.keys(Colormaps), ...Object.keys(CmoceanColormaps)].join(', ');
    throw new Error(`terraplot: unknown colormap "${cmap}". Available: ${all}`);
  }
  throw new Error(`terraplot: cmap must be a string or function`);
}

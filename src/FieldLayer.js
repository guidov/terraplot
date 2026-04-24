import * as THREE from 'three';
import { resolveColormap } from './colormaps.js';

const TEX_W = 1024;
const TEX_H = 512;

/**
 * Renders a scalar field on the globe as a canvas texture sphere.
 * Zero z-fighting — single mesh, no polygon overlap.
 *
 * Field input: 2D array field[j][i] or flat TypedArray with row-major layout.
 *   j = latitude index (lats[0] = first lat value)
 *   i = longitude index (lons[0] = first lon value)
 *
 * lons: 1D array, ascending, e.g. [-180, ..., 180]
 * lats: 1D array, ascending or descending, e.g. [90, ..., -90]
 */
export class FieldLayer {
  constructor(lons, lats, field, options, globeRadius) {
    const {
      cmap = 'viridis',
      alpha = 0.7,
      levels = null,   // null = smooth (pcolormesh), integer = banded (contourf)
      vmin = null,
      vmax = null,
      zorder = 0,
    } = options;

    const colorFn = resolveColormap(cmap);
    const texture = buildTexture(lons, lats, field, { colorFn, alpha, levels, vmin, vmax });

    const r = globeRadius * (1.003 + zorder * 0.002);
    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(r, 72, 36),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }),
    );
    this._texture = texture;
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this._texture.dispose();
  }
}

function buildTexture(lons, lats, field, { colorFn, alpha, levels, vmin, vmax }) {
  const nlon = lons.length;
  const nlat = lats.length;

  // Flat or nested field access
  const isFlat = !Array.isArray(field[0]) && !(field[0] instanceof Float32Array || field[0] instanceof Float64Array);
  const get = isFlat
    ? (j, i) => field[j * nlon + i]
    : (j, i) => field[j][i];

  // Auto min/max
  let minV = vmin, maxV = vmax;
  if (minV == null || maxV == null) {
    minV = Infinity; maxV = -Infinity;
    for (let j = 0; j < nlat; j++) {
      for (let i = 0; i < nlon; i++) {
        const v = get(j, i);
        if (v < minV) minV = v;
        if (v > maxV) maxV = v;
      }
    }
  }
  const range = maxV - minV || 1;

  // Lat direction: ascending or descending
  const latAscending = lats[nlat - 1] > lats[0];

  const canvas = document.createElement('canvas');
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(TEX_W, TEX_H);
  const buf = img.data;
  const alphaInt = Math.round(Math.max(0, Math.min(1, alpha)) * 255);

  for (let row = 0; row < TEX_H; row++) {
    for (let col = 0; col < TEX_W; col++) {
      // Canvas row 0 = top = lat 90N; row H-1 = lat 90S
      const targetLon = lons[0] + (col / TEX_W) * (lons[nlon - 1] - lons[0]);
      const targetLat = latAscending
        ? lats[nlat - 1] - (row / TEX_H) * (lats[nlat - 1] - lats[0])
        : lats[0]       - (row / TEX_H) * (lats[0] - lats[nlat - 1]);

      // Bilinear interpolation indices
      const lonFrac = (targetLon - lons[0]) / (lons[nlon - 1] - lons[0]);
      const latFrac = latAscending
        ? 1 - (targetLat - lats[0]) / (lats[nlat - 1] - lats[0])
        : (lats[0] - targetLat) / (lats[0] - lats[nlat - 1]);

      const gi = lonFrac * (nlon - 1);
      const gj = latFrac * (nlat - 1);

      const i0 = Math.max(0, Math.floor(gi)), i1 = Math.min(i0 + 1, nlon - 1);
      const j0 = Math.max(0, Math.floor(gj)), j1 = Math.min(j0 + 1, nlat - 1);
      const fi = gi - i0, fj = gj - j0;

      const val = (
        get(j0, i0) * (1 - fi) * (1 - fj) +
        get(j0, i1) *      fi  * (1 - fj) +
        get(j1, i0) * (1 - fi) *      fj  +
        get(j1, i1) *      fi  *      fj
      );

      let t = (val - minV) / range;

      // Quantize for contourf banded mode
      if (levels != null && levels > 1) {
        t = Math.floor(t * levels) / levels;
      }

      const [r, g, b] = colorFn(Math.max(0, Math.min(1, t)));
      const idx = (row * TEX_W + col) * 4;
      buf[idx]     = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
      buf[idx + 3] = alphaInt;
    }
  }

  ctx.putImageData(img, 0, 0);
  return new THREE.CanvasTexture(canvas);
}

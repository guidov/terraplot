import * as THREE from 'three';
import { contours } from 'd3-contour';
import { resolveColormap } from './colormaps.js';

/**
 * Contour isolines — equivalent to ax.contour() in cartopy/matplotlib.
 *
 * Runs d3-contour on the scalar field, converts rings to 3D line segments
 * on the globe surface. Zero z-fighting: lines sit just above the field layer.
 */
export class ContourLayer {
  constructor(lons, lats, field, options, globeRadius) {
    const {
      levels  = 8,
      cmap    = null,
      color   = '#ffffff',
      alpha   = 0.9,
      vmin    = null,
      vmax    = null,
      zorder  = 1,
    } = options;

    const nlon = lons.length;
    const nlat = lats.length;
    const r = globeRadius * (1.006 + zorder * 0.001);

    // Flatten to Float32Array (row-major, j=lat index, i=lon index)
    const flat = flattenField(field, nlat, nlon);

    // Min/max
    let minV = vmin, maxV = vmax;
    if (minV == null || maxV == null) {
      minV = Infinity; maxV = -Infinity;
      for (let k = 0; k < flat.length; k++) {
        if (!isNaN(flat[k])) {
          if (flat[k] < minV) minV = flat[k];
          if (flat[k] > maxV) maxV = flat[k];
        }
      }
    }
    const range = maxV - minV || 1;

    // Thresholds
    const thresholds = Array.isArray(levels)
      ? levels
      : Array.from({ length: levels }, (_, i) =>
          minV + ((i + 0.5) / levels) * range);

    const contourGen = contours().size([nlon, nlat]).thresholds(thresholds);
    const rawContours = contourGen(flat);

    const colorFn  = cmap ? resolveColormap(cmap) : null;
    const latRange = lats[nlat - 1] - lats[0];
    const lonRange = lons[nlon - 1] - lons[0];

    const positions = [];
    const vertColors = [];

    for (const c of rawContours) {
      const t = (c.value - minV) / range;
      const [cr, cg, cb] = colorFn
        ? colorFn(Math.max(0, Math.min(1, t)))
        : hexToRgb(color);
      const rn = cr / 255, gn = cg / 255, bn = cb / 255;

      for (const polygon of c.coordinates) {
        for (const ring of polygon) {
          for (let k = 0; k < ring.length - 1; k++) {
            const [gx0, gy0] = ring[k];
            const [gx1, gy1] = ring[k + 1];

            // Grid coords → lon/lat (d3-contour uses [col, row] = [lon-index, lat-index])
            const lon0 = lons[0] + (gx0 / (nlon - 1)) * lonRange;
            const lat0 = lats[0] + (gy0 / (nlat - 1)) * latRange;
            const lon1 = lons[0] + (gx1 / (nlon - 1)) * lonRange;
            const lat1 = lats[0] + (gy1 / (nlat - 1)) * latRange;

            positions.push(...latlngToXyz(lat0, lon0, r), ...latlngToXyz(lat1, lon1, r));
            vertColors.push(rn, gn, bn, rn, gn, bn);
          }
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.Float32BufferAttribute(vertColors, 3));

    this.mesh = new THREE.LineSegments(geo,
      new THREE.LineBasicMaterial({ vertexColors: true, transparent: alpha < 1, opacity: alpha }),
    );
    this._geo = geo;
    this._mat = this.mesh.material;
  }

  dispose() {
    this._geo.dispose();
    this._mat.dispose();
  }
}

// ── helpers ───────────────────────────────────────────────────────────────────

function flattenField(field, nlat, nlon) {
  const isFlat = !Array.isArray(field[0]) &&
    !(field[0] instanceof Float32Array) &&
    !(field[0] instanceof Float64Array);
  if (isFlat) return field instanceof Float32Array ? field : new Float32Array(field);
  const out = new Float32Array(nlat * nlon);
  for (let j = 0; j < nlat; j++)
    for (let i = 0; i < nlon; i++)
      out[j * nlon + i] = field[j][i];
  return out;
}

function latlngToXyz(lat, lng, r) {
  const phi   = (90 - lat)   * (Math.PI / 180);
  const theta = (lng + 180)  * (Math.PI / 180);
  return [
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  ];
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0,2), 16), parseInt(h.slice(2,4), 16), parseInt(h.slice(4,6), 16)];
}

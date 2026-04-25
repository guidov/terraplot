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
      levels      = 8,
      cmap        = null,
      color       = '#ffffff',
      alpha       = 0.9,
      vmin        = null,
      vmax        = null,
      zorder      = 1,
      smoothFactor = 4,   // bilinear upsample before contouring (1 = off)
      chaikin      = 2,   // corner-cutting iterations on output rings (0 = off)
    } = options;

    let nlon = lons.length;
    let nlat = lats.length;
    const r = globeRadius * (1.006 + zorder * 0.001);

    // Flatten to Float32Array (row-major, j=lat index, i=lon index)
    let flat = flattenField(field, nlat, nlon);

    // Bilinear upsample before contouring — reduces marching-squares staircase.
    // Mirrors what VTK/ParaView do: operate on a finer grid so contour edges
    // sit at sub-cell positions. scipy.ndimage.gaussian_filter is the cartopy
    // equivalent on the Python side.
    if (smoothFactor > 1) {
      ({ field: flat, nlat, nlon } = upsampleField(flat, nlat, nlon, smoothFactor));
    }

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
    const latRange = lats[lats.length - 1] - lats[0];
    const lonRange = lons[lons.length - 1] - lons[0];

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
          // Chaikin corner-cutting — converges to quadratic B-spline.
          // Used in D3's curveCatmullRom; here applied to the ring vertices
          // in grid space before projecting onto the sphere.
          const smoothedRing = chaikin > 0 ? chaikinSmooth(ring, chaikin) : ring;

          for (let k = 0; k < smoothedRing.length - 1; k++) {
            const [gx0, gy0] = smoothedRing[k];
            const [gx1, gy1] = smoothedRing[k + 1];

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

/**
 * Bilinear upsample — increases grid resolution before contouring.
 * scale=4 turns a 94×192 NCEP grid into 373×765, giving d3-contour
 * 16× more intersection points to choose from.
 */
function upsampleField(flat, nlat, nlon, scale) {
  const nlat2 = (nlat - 1) * scale + 1;
  const nlon2 = (nlon - 1) * scale + 1;
  const out   = new Float32Array(nlat2 * nlon2);
  for (let j2 = 0; j2 < nlat2; j2++) {
    const gj = j2 / scale;
    const j0 = Math.min(Math.floor(gj), nlat - 2);
    const fj = gj - j0;
    for (let i2 = 0; i2 < nlon2; i2++) {
      const gi = i2 / scale;
      const i0 = Math.min(Math.floor(gi), nlon - 2);
      const fi = gi - i0;
      out[j2 * nlon2 + i2] =
        flat[ j0      * nlon + i0    ] * (1 - fi) * (1 - fj) +
        flat[ j0      * nlon + (i0+1)] *      fi  * (1 - fj) +
        flat[(j0 + 1) * nlon + i0    ] * (1 - fi) *      fj  +
        flat[(j0 + 1) * nlon + (i0+1)] *      fi  *      fj;
    }
  }
  return { field: out, nlat: nlat2, nlon: nlon2 };
}

/**
 * Chaikin's corner-cutting algorithm on a ring of [x,y] grid coords.
 * Each iteration doubles the point count and rounds corners toward a
 * quadratic B-spline. 2–3 iterations is enough for smooth contours.
 */
function chaikinSmooth(ring, iterations) {
  let pts = ring;
  const closed = pts[0][0] === pts[pts.length - 1][0] &&
                 pts[0][1] === pts[pts.length - 1][1];
  for (let iter = 0; iter < iterations; iter++) {
    const next = [];
    const n = closed ? pts.length - 1 : pts.length - 1;
    for (let i = 0; i < n; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      next.push([0.75 * x0 + 0.25 * x1, 0.75 * y0 + 0.25 * y1]);
      next.push([0.25 * x0 + 0.75 * x1, 0.25 * y0 + 0.75 * y1]);
    }
    if (closed) next.push(next[0]);
    pts = next;
  }
  return pts;
}

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

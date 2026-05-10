/**
 * QuiverLayer — vector field arrows (u, v) on a GeoMap.
 *
 * Mirrors matplotlib/cartopy ax.quiver(lon, lat, u, v).
 * Arrows are projected through the GeoMap projection and drawn as SVG.
 *
 * Usage (within GeoMap.quiver):
 *   const q = new QuiverLayer(lons, lats, u, v, { density, scale, color });
 *   q.render(svgRoot, projection);
 *
 * Field input: u, v are 2D arrays [j][i] or flat row-major TypedArrays.
 *   j = lat index, i = lon index.
 *
 * Notes:
 *   - density: subsample factor — 1 draws every grid point, 2 draws every other, etc.
 *     Auto-tuned in GeoMap.quiver based on canvas width.
 *   - scale:   pixels per (u-magnitude unit at vmax) — clamps very long arrows.
 *   - color:   single color string (e.g. 'rgba(255,255,255,0.8)') OR
 *              cmap name → arrows colored by magnitude.
 */

import { resolveColormap } from './colormaps.js';

const DEFAULTS = {
  density:    null,    // null = auto from canvas width
  scale:      18,      // px max-arrow length
  color:      'rgba(255,255,255,0.85)',
  cmap:       null,    // if set, color by magnitude
  linewidth:  1.0,
  headSize:   3.0,     // px
  vmin:       null,
  vmax:       null,
};

export class QuiverLayer {
  constructor(lons, lats, u, v, options = {}) {
    this._lons = lons;
    this._lats = lats;
    this._opts = { ...DEFAULTS, ...options };
    const nlon = lons.length, nlat = lats.length;
    this._nlon = nlon; this._nlat = nlat;
    this._u = _flatten(u, nlat, nlon);
    this._v = _flatten(v, nlat, nlon);

    // magnitude range
    let mn = Infinity, mx = -Infinity;
    for (let k = 0; k < this._u.length; k++) {
      const m = Math.hypot(this._u[k], this._v[k]);
      if (isFinite(m)) { if (m < mn) mn = m; if (m > mx) mx = m; }
    }
    this._minM = options.vmin ?? mn;
    this._maxM = options.vmax ?? mx;
  }

  /**
   * Render arrows as SVG path elements into an existing <g> group.
   * @param {SVGGElement} group        SVG group element to render into
   * @param {Function}    projectFn    [lon, lat] → [x, y] in pixels
   * @param {number}      canvasWidth  used for density auto-tuning
   */
  render(group, projectFn, canvasWidth) {
    const o = this._opts;
    const nlon = this._nlon, nlat = this._nlat;
    const NS = 'http://www.w3.org/2000/svg';

    // Auto density: aim for ~30 arrows across canvas width
    const density = o.density ?? Math.max(1, Math.round(nlon / 30));
    const colorFn = o.cmap ? resolveColormap(o.cmap) : null;
    const range   = (this._maxM - this._minM) || 1;

    while (group.firstChild) group.removeChild(group.firstChild);

    for (let j = 0; j < nlat; j += density) {
      for (let i = 0; i < nlon; i += density) {
        const k  = j * nlon + i;
        const u  = this._u[k];
        const v  = this._v[k];
        if (!isFinite(u) || !isFinite(v)) continue;

        const mag = Math.hypot(u, v);
        if (mag === 0) continue;

        const p0 = projectFn([this._lons[i], this._lats[j]]);
        if (!p0) continue;

        // Project a small offset point in geographic-east/north
        // to recover the local pixel-space (du, dv) heading.
        const dLon = 0.5;  // tiny test offset; works for any projection
        const p1 = projectFn([this._lons[i] + dLon, this._lats[j]]);
        const p2 = projectFn([this._lons[i],        this._lats[j] + dLon]);
        if (!p1 || !p2) continue;

        // Local basis vectors (px per geographic-degree in this neighbourhood)
        const ex = (p1[0] - p0[0]) / dLon, ey = (p1[1] - p0[1]) / dLon;  // east
        const nx = (p2[0] - p0[0]) / dLon, ny = (p2[1] - p0[1]) / dLon;  // north

        // Pixel-space arrow vector (u east-component, v north-component)
        // Normalize magnitude to [0,1] for length scaling.
        const lenScale = (Math.min(mag, this._maxM) / this._maxM) * o.scale;
        const ux = u / mag, uy = v / mag;
        const dx = (ex * ux + nx * uy) * lenScale / Math.hypot(ex, ey);
        const dy = (ey * ux + ny * uy) * lenScale / Math.hypot(ex, ey);

        const stroke = colorFn
          ? `rgb(${colorFn(Math.max(0, Math.min(1, (mag - this._minM) / range))).join(',')})`
          : o.color;

        // Centre the arrow on the grid point so visual mass stays anchored.
        const x0 = p0[0] - dx / 2, y0 = p0[1] - dy / 2;
        const x1 = p0[0] + dx / 2, y1 = p0[1] + dy / 2;

        // Arrow shaft
        const line = document.createElementNS(NS, 'line');
        line.setAttribute('x1', x0); line.setAttribute('y1', y0);
        line.setAttribute('x2', x1); line.setAttribute('y2', y1);
        line.setAttribute('stroke', stroke);
        line.setAttribute('stroke-width', o.linewidth);
        line.setAttribute('stroke-linecap', 'round');
        group.appendChild(line);

        // Arrowhead (small filled triangle at tip)
        const ang  = Math.atan2(dy, dx);
        const hs   = o.headSize;
        const hx1  = x1 - hs * Math.cos(ang - Math.PI / 7);
        const hy1  = y1 - hs * Math.sin(ang - Math.PI / 7);
        const hx2  = x1 - hs * Math.cos(ang + Math.PI / 7);
        const hy2  = y1 - hs * Math.sin(ang + Math.PI / 7);
        const head = document.createElementNS(NS, 'polygon');
        head.setAttribute('points', `${x1},${y1} ${hx1},${hy1} ${hx2},${hy2}`);
        head.setAttribute('fill', stroke);
        group.appendChild(head);
      }
    }
  }
}

function _flatten(field, nlat, nlon) {
  if (field instanceof Float32Array || field instanceof Float64Array) return field;
  const isFlat = !Array.isArray(field[0]);
  if (isFlat) return field;
  const out = new Float32Array(nlat * nlon);
  for (let j = 0; j < nlat; j++)
    for (let i = 0; i < nlon; i++)
      out[j * nlon + i] = field[j][i];
  return out;
}

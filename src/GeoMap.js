/**
 * GeoMap — 2D flat cartographic map with interactive tooltips.
 *
 * Projections (via d3-geo): PlateCarree/Equirectangular, Mercator, Orthographic,
 * NaturalEarth, Stereographic, AzimuthalEqualArea, Albers/ConicEqualArea,
 * LambertConformal, Gnomonic.
 *
 * Same field API as GeoSphere: pcolormesh(), contourf(), contour(), addFeature().
 * Adds mpld3-style hover tooltip: lat, lon, field value.
 *
 * Rendering:
 *   - canvas  → rasterized field (pcolormesh / contourf) via projection.invert()
 *   - SVG     → geographic features + contour isolines via d3 geoPath
 *   - tooltip → floating div, updates on mousemove
 */

import {
  geoEquirectangular, geoMercator, geoOrthographic, geoNaturalEarth1,
  geoStereographic, geoAzimuthalEqualArea, geoConicEqualArea,
  geoConicConformal, geoGnomonic, geoPath, geoGraticule,
} from 'd3-geo';
import { contours } from 'd3-contour';
import { resolveColormap } from './colormaps.js';
import { FEATURE_URLS } from './features.js';
import { QuiverLayer } from './QuiverLayer.js';

// ── Projection registry ────────────────────────────────────────────────────

const PROJ_REGISTRY = {
  equirectangular:     geoEquirectangular,
  platecarree:         geoEquirectangular,
  mercator:            geoMercator,
  orthographic:        geoOrthographic,
  naturalearth:        geoNaturalEarth1,
  naturalearth1:       geoNaturalEarth1,
  stereographic:       geoStereographic,
  azimuthalequalarea:  geoAzimuthalEqualArea,
  equalarea:           geoAzimuthalEqualArea,
  coniquequalarea:     geoConicEqualArea,
  albers:              geoConicEqualArea,
  lambertconformal:    geoConicConformal,
  gnomonic:            geoGnomonic,
};

function resolveProjection(name) {
  const key = (name || 'equirectangular').toLowerCase().replace(/[\s_-]/g, '');
  return PROJ_REGISTRY[key] ?? geoEquirectangular;
}

// Max raster width — canvas is upscaled via CSS for display (GPU-accelerated).
// Keeps rasterization fast even on large viewports.
const RASTER_CAP = 960;

// ── GeoMap ─────────────────────────────────────────────────────────────────

export class GeoMap {
  /**
   * @param {string|Element} container  CSS selector or DOM element
   * @param {object} options
   * @param {string}   options.projection   Projection name (default 'equirectangular')
   * @param {string}   options.background   Background color (default '#090912')
   * @param {boolean}  options.graticule    Draw lat/lon grid (default true)
   * @param {string}   options.graticuleColor
   * @param {number[]} options.center       [lon, lat] map center (default [0,0])
   * @param {number[]} options.rotate       [λ,φ,γ] explicit d3 rotation (overrides center)
   * @param {boolean}  options.tooltip      Enable hover tooltip (default true)
   */
  constructor(container, options = {}) {
    this._el = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    const {
      projection     = 'equirectangular',
      background     = '#090912',
      graticule      = true,
      graticuleColor = 'rgba(255,255,255,0.09)',
      center         = [0, 0],
      rotate         = null,
      tooltip        = true,
      // extent: [lon0, lon1, lat0, lat1] — zoom to a region (like cartopy set_extent)
      extent         = null,
    } = options;

    this._background     = background;
    this._layers         = [];   // {id, type, lons?, lats?, field?, opts?, svgGroup?}
    this._featureGroups  = [];   // {type, opts, svgGroup, geojson?}
    this._markers        = [];   // {lat, lon, opts, svgEl}
    this._titleEl        = null;
    this._clickHandlers  = [];
    this._nextId         = 0;
    this._fieldData      = null;
    this._gratEl         = null;
    this._activeAnims    = [];

    const rect = this._el.getBoundingClientRect();
    this._w = rect.width  || 900;
    this._h = rect.height || 500;

    Object.assign(this._el.style, {
      position: 'relative', overflow: 'hidden', background,
    });

    // ── Canvas (rasterized field) ────────────────────────────────────────
    this._canvas = document.createElement('canvas');
    this._canvas.width  = this._w;
    this._canvas.height = this._h;
    Object.assign(this._canvas.style, { position: 'absolute', top: '0', left: '0' });
    this._el.appendChild(this._canvas);
    this._ctx = this._canvas.getContext('2d');

    // ── SVG (features + isolines) ────────────────────────────────────────
    const NS = 'http://www.w3.org/2000/svg';
    this._NS = NS;
    this._svg = document.createElementNS(NS, 'svg');
    this._svg.setAttribute('width',  this._w);
    this._svg.setAttribute('height', this._h);
    Object.assign(this._svg.style, {
      position: 'absolute', top: '0', left: '0', pointerEvents: 'none',
    });
    this._el.appendChild(this._svg);

    // ── Tooltip ──────────────────────────────────────────────────────────
    if (tooltip) {
      this._tip = document.createElement('div');
      Object.assign(this._tip.style, {
        position: 'absolute', pointerEvents: 'none', display: 'none',
        background: 'rgba(8,8,20,0.88)', color: '#e2e8f0',
        font: '12px/1.6 ui-monospace,"Cascadia Code",monospace',
        padding: '6px 10px', borderRadius: '5px', whiteSpace: 'pre',
        border: '1px solid rgba(255,255,255,0.18)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.5)', zIndex: '10',
      });
      this._el.appendChild(this._tip);
      this._canvas.addEventListener('mousemove',  this._onMove.bind(this));
      this._canvas.addEventListener('mouseleave', () => { this._tip.style.display = 'none'; });
    }

    // Forward clicks to user handlers — pointer-events on canvas are on by default
    this._canvas.style.pointerEvents = 'auto';
    this._canvas.addEventListener('click', this._onClick.bind(this));

    // Auto-resize on container changes — keeps projection fitted to new size
    this._resizeObs = new ResizeObserver(() => this._handleResize());
    this._resizeObs.observe(this._el);

    // ── d3-geo projection ────────────────────────────────────────────────
    this._proj = resolveProjection(projection)()
      .fitSize([this._w, this._h], { type: 'Sphere' });

    if (rotate) {
      this._proj.rotate(rotate);
    } else if (center[0] !== 0 || center[1] !== 0) {
      // d3-geo rotation is [−λ, −φ, 0] for centering on [λ, φ]
      this._proj.rotate([-center[0], -center[1], 0]);
    }

    // Regional extent — refit projection to a lon/lat bounding box
    if (extent) {
      const [lon0, lon1, lat0, lat1] = extent;
      const pad = Math.min(this._w, this._h) * 0.04;  // 4% padding
      const bboxGeo = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[lon0, lat0], [lon1, lat0], [lon1, lat1], [lon0, lat1], [lon0, lat0]]],
        },
      };
      this._proj.fitExtent([[pad, pad], [this._w - pad, this._h - pad]], bboxGeo);
    }

    this._path = geoPath().projection(this._proj);

    // Sphere background fill (clips to projection boundary)
    this._sphereEl = document.createElementNS(NS, 'path');
    this._sphereEl.setAttribute('d', this._path({ type: 'Sphere' }));
    this._sphereEl.setAttribute('fill', background);
    this._sphereEl.setAttribute('stroke', 'rgba(255,255,255,0.25)');
    this._sphereEl.setAttribute('stroke-width', '1');
    this._svg.appendChild(this._sphereEl);

    // Graticule grid
    if (graticule) {
      this._gratEl = document.createElementNS(NS, 'path');
      this._gratEl.setAttribute('d', this._path(geoGraticule()()));
      this._gratEl.setAttribute('fill', 'none');
      this._gratEl.setAttribute('stroke', graticuleColor);
      this._gratEl.setAttribute('stroke-width', '0.5');
      this._svg.appendChild(this._gratEl);
    }
  }

  // ── Public field API (matches GeoSphere) ──────────────────────────────────

  /**
   * Smooth colour-filled field.  Equivalent to ax.pcolormesh() in cartopy.
   * @param {number[]} lons   1D lon array, ascending
   * @param {number[]} lats   1D lat array, ascending or descending
   * @param {Array}    field  2D array field[j][i] or flat TypedArray
   * @param {object}   opts   { cmap, alpha, vmin, vmax, name, units }
   * @returns {number} layer id
   */
  pcolormesh(lons, lats, field, opts = {}) {
    const id = ++this._nextId;
    const { cmap = 'viridis', alpha = 0.85, vmin = null, vmax = null } = opts;
    const pd = _prepField(lons, lats, field, vmin, vmax);
    this._rasterize(pd, lons, lats, resolveColormap(cmap), alpha, null);
    this._storeField(lons, lats, pd, opts);
    this._layers.push({ id, type: 'pcolormesh', lons, lats, field, opts });
    return id;
  }

  /**
   * Banded colour-filled field.  Equivalent to ax.contourf() in cartopy.
   * @param {number} opts.levels   Number of discrete bands (default 12)
   */
  contourf(lons, lats, field, opts = {}) {
    const id = ++this._nextId;
    const { cmap = 'viridis', alpha = 0.85, levels = 12, vmin = null, vmax = null } = opts;
    const pd = _prepField(lons, lats, field, vmin, vmax);
    this._rasterize(pd, lons, lats, resolveColormap(cmap), alpha, levels);
    this._storeField(lons, lats, pd, opts);
    this._layers.push({ id, type: 'contourf', lons, lats, field, opts });
    return id;
  }

  /**
   * Contour isolines rendered as SVG paths projected through the map.
   * Equivalent to ax.contour() in cartopy.
   */
  contour(lons, lats, field, opts = {}) {
    const id = ++this._nextId;
    const {
      levels = 8, cmap = null, color = 'rgba(255,255,255,0.75)',
      alpha = 0.9, vmin = null, vmax = null,
      linewidth = 1.2, smoothFactor = 4, chaikin = 2,
    } = opts;

    const { flat, nlon, nlat, minV, maxV } = _prepFieldFlat(lons, lats, field, vmin, vmax);
    const range = maxV - minV || 1;
    const colorFn = cmap ? resolveColormap(cmap) : null;

    let workFlat = flat, wNlon = nlon, wNlat = nlat;
    if (smoothFactor > 1) {
      ({ field: workFlat, nlon: wNlon, nlat: wNlat } = _upsample(flat, nlat, nlon, smoothFactor));
    }

    const thresholds = Array.isArray(levels)
      ? levels
      : Array.from({ length: levels }, (_, k) => minV + ((k + 0.5) / levels) * range);

    const rings = contours().size([wNlon, wNlat]).thresholds(thresholds)(workFlat);

    const lonRange = lons[lons.length - 1] - lons[0];
    const latRange = lats[lats.length - 1] - lats[0];
    const NS = this._NS;
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', `tp-contour-${id}`);
    g.setAttribute('opacity', String(alpha));

    for (const c of rings) {
      const t = Math.max(0, Math.min(1, (c.value - minV) / range));
      const stroke = colorFn ? `rgb(${colorFn(t).join(',')})` : color;

      for (const poly of c.coordinates) {
        for (let ring of poly) {
          if (chaikin > 0) ring = _chaikin(ring, chaikin);
          // Grid-space → geographic → SVG path through projection
          const coords = ring.map(([gx, gy]) => [
            lons[0] + (gx / (wNlon - 1)) * lonRange,
            lats[0] + (gy / (wNlat - 1)) * latRange,
          ]);
          const svgEl = document.createElementNS(NS, 'path');
          svgEl.setAttribute('d', this._path({ type: 'LineString', coordinates: coords }));
          svgEl.setAttribute('fill', 'none');
          svgEl.setAttribute('stroke', stroke);
          svgEl.setAttribute('stroke-width', String(linewidth));
          g.appendChild(svgEl);
        }
      }
    }

    this._svg.appendChild(g);
    this._layers.push({ id, type: 'contour', lons, lats, field, opts, svgGroup: g });
    return id;
  }

  /**
   * Add a geographic feature (coastlines, borders) as SVG paths.
   * GeoJSON is fetched once and cached for reprojection on setExtent().
   * @param {string} type   'coastlines' | 'borders'
   * @param {object} opts   { color, linewidth, opacity, url }
   */
  addFeature(type, opts = {}) {
    const defaultColor = type === 'coastlines'
      ? 'rgba(200,220,255,0.85)' : 'rgba(180,180,200,0.5)';
    const { color = defaultColor, linewidth = 0.8, opacity = 1, url = null } = opts;

    // Idempotent: if a group of this type already exists, just update its style
    const existing = this._featureGroups.find(fg => fg.type === type);
    if (existing) {
      existing.opts = { color, linewidth, opacity };
      existing.svgGroup.setAttribute('opacity', String(opacity));
      if (existing.geojson) this._renderFeature(existing);
      return this;
    }

    const featureUrl = url || FEATURE_URLS[type];
    if (!featureUrl) { console.warn(`[GeoMap] No URL for feature: ${type}`); return this; }

    const NS  = this._NS;
    const g   = document.createElementNS(NS, 'g');
    g.setAttribute('class', `tp-feature-${type}`);
    g.setAttribute('opacity', String(opacity));
    this._svg.appendChild(g);

    const fg = { type, opts: { color, linewidth, opacity }, svgGroup: g, geojson: null };
    this._featureGroups.push(fg);

    fetch(featureUrl)
      .then(r => r.json())
      .then(geo => {
        fg.geojson = geo;
        this._renderFeature(fg);
      })
      .catch(err => console.warn(`[GeoMap] Feature fetch failed for ${type}:`, err));
    return this;
  }

  /**
   * Vector field arrows — equivalent to ax.quiver() in cartopy.
   * @param {number[]} lons   1D lon array
   * @param {number[]} lats   1D lat array
   * @param {Array}    u      east-west wind component (2D or flat)
   * @param {Array}    v      north-south wind component (2D or flat)
   * @param {object}   opts   { density, scale, color, cmap, linewidth, headSize, vmin, vmax }
   * @returns {number} layer id
   */
  quiver(lons, lats, u, v, opts = {}) {
    const id = ++this._nextId;
    const NS = this._NS;
    const g  = document.createElementNS(NS, 'g');
    g.setAttribute('class', `tp-quiver-${id}`);
    this._svg.appendChild(g);

    const layer = new QuiverLayer(lons, lats, u, v, opts);
    layer.render(g, p => this._proj(p), this._w);
    this._layers.push({ id, type: 'quiver', lons, lats, u, v, opts, svgGroup: g, qLayer: layer });
    return id;
  }

  /**
   * Drop a labelled marker at a geographic point.
   * Equivalent to ax.plot(lon, lat, marker='*') in cartopy.
   * @returns {number} marker id (use clearMarker(id) to remove)
   */
  marker(lat, lon, opts = {}) {
    const {
      label  = null,
      color  = '#fbbf24',
      size   = 6,
      ringColor = 'rgba(0,0,0,0.85)',
    } = opts;

    const NS = this._NS;
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'tp-marker');

    const c = document.createElementNS(NS, 'circle');
    const ring = document.createElementNS(NS, 'circle');
    g.appendChild(ring);
    g.appendChild(c);

    let labelEl = null;
    if (label) {
      labelEl = document.createElementNS(NS, 'text');
      labelEl.setAttribute('font-size', '11');
      labelEl.setAttribute('font-family', 'system-ui, sans-serif');
      labelEl.setAttribute('fill', '#e2e8f0');
      labelEl.setAttribute('paint-order', 'stroke');
      labelEl.setAttribute('stroke', 'rgba(0,0,0,0.85)');
      labelEl.setAttribute('stroke-width', '3');
      labelEl.textContent = label;
      g.appendChild(labelEl);
    }

    const m = { lat, lon, color, size, ringColor, label, svgEl: g, circleEl: c, ringEl: ring, labelEl, id: ++this._nextId };
    this._markers.push(m);
    this._svg.appendChild(g);
    this._renderMarker(m);
    return m.id;
  }

  clearMarker(id) {
    const idx = this._markers.findIndex(m => m.id === id);
    if (idx < 0) return;
    this._markers[idx].svgEl.remove();
    this._markers.splice(idx, 1);
  }

  clearMarkers() {
    this._markers.forEach(m => m.svgEl.remove());
    this._markers = [];
  }

  _renderMarker(m) {
    const p = this._proj([m.lon, m.lat]);
    if (!p) { m.svgEl.style.display = 'none'; return; }
    m.svgEl.style.display = '';
    m.circleEl.setAttribute('cx', p[0]);
    m.circleEl.setAttribute('cy', p[1]);
    m.circleEl.setAttribute('r',  m.size);
    m.circleEl.setAttribute('fill', m.color);
    m.ringEl.setAttribute('cx', p[0]);
    m.ringEl.setAttribute('cy', p[1]);
    m.ringEl.setAttribute('r',  m.size + 2);
    m.ringEl.setAttribute('fill', 'none');
    m.ringEl.setAttribute('stroke', m.ringColor);
    m.ringEl.setAttribute('stroke-width', '2');
    if (m.labelEl) {
      m.labelEl.setAttribute('x', p[0] + m.size + 4);
      m.labelEl.setAttribute('y', p[1] + 4);
    }
  }

  /**
   * Register a click handler.  Receives { lat, lon, value, x, y } on every map click.
   * @returns {Function} unsubscribe function
   */
  onClick(fn) {
    this._clickHandlers.push(fn);
    return () => {
      const i = this._clickHandlers.indexOf(fn);
      if (i >= 0) this._clickHandlers.splice(i, 1);
    };
  }

  _onClick(e) {
    if (!this._clickHandlers.length) return;
    const rect = this._canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const coord = this._proj.invert([px, py]);
    if (!coord) return;
    const [lon, lat] = coord;
    if (!isFinite(lon) || !isFinite(lat)) return;
    let value = NaN;
    if (this._fieldData) {
      const fd = this._fieldData;
      value = _sample(lon, lat, fd.lons, fd.lats, fd.get, fd.nlon, fd.nlat);
    }
    for (const fn of this._clickHandlers) fn({ lat, lon, value, x: px, y: py });
  }

  _renderFeature(fg) {
    fg.svgGroup.innerHTML = '';
    const el = document.createElementNS(this._NS, 'path');
    el.setAttribute('d', this._path(fg.geojson));
    el.setAttribute('fill', 'none');
    el.setAttribute('stroke', fg.opts.color);
    el.setAttribute('stroke-width', String(fg.opts.linewidth));
    fg.svgGroup.appendChild(el);
  }

  // ── Animation ─────────────────────────────────────────────────────────────

  /**
   * Animate through an array of field frames.  Same API as GeoSphere.animate().
   *
   * frames: array of { lons, lats, field } objects
   *         OR compact format { lons, lats, frames: [{ field, coord_value }] }
   *         (compact is what pyterraplot.binary.pack_frames() / frames_compact() produces)
   *
   * options.type:         'pcolormesh' | 'contourf'  (default 'pcolormesh')
   * options.interval:     ms between frames  (default 600)
   * options.loop:         loop back to start (default true)
   * options.layerOptions: passed to pcolormesh / contourf
   * options.onFrame:      callback(frameIndex, frameData)
   *
   * Returns { play(), pause(), stop(), seek(i), frame }
   */
  animate(frames, options = {}) {
    const {
      type         = 'pcolormesh',
      interval     = 600,
      loop         = true,
      layerOptions = {},
      onFrame      = null,
    } = options;

    let frameList, sharedLons, sharedLats;
    if (!Array.isArray(frames) && frames.frames) {
      sharedLons = frames.lons;
      sharedLats = frames.lats;
      frameList  = frames.frames;
    } else {
      frameList = frames;
    }

    let idx     = 0;
    let running = false;
    let timerId = null;

    const show = (i) => {
      const f    = frameList[i];
      const lons = sharedLons ?? f.lons;
      const lats = sharedLats ?? f.lats;
      this.clear(type);
      this[type](lons, lats, f.field, layerOptions);
      onFrame?.(i, f);
    };

    const tick = () => {
      show(idx);
      idx = (idx + 1) % frameList.length;
      if (!loop && idx === 0) pause();
    };

    const play = () => {
      if (running) return;
      running = true;
      tick();
      timerId = setInterval(tick, interval);
    };

    const pause = () => {
      running = false;
      clearInterval(timerId);
    };

    const stop = () => {
      pause();
      idx = 0;
      this.clear(type);
    };

    const seek = (i) => {
      idx = Math.max(0, Math.min(frameList.length - 1, i));
      show(idx);
    };

    play();
    const handle = { play, pause, stop, seek, get frame() { return idx; } };
    this._activeAnims.push(handle);
    return handle;
  }

  // ── Layer management ──────────────────────────────────────────────────────

  clear(idOrType) {
    if (typeof idOrType === 'number') {
      const idx = this._layers.findIndex(l => l.id === idOrType);
      if (idx >= 0) { this._drop(this._layers[idx]); this._layers.splice(idx, 1); }
    } else {
      this._layers = this._layers.filter(l => {
        if (l.type === idOrType) { this._drop(l); return false; }
        return true;
      });
    }
    if (!this._layers.some(l => l.type === 'pcolormesh' || l.type === 'contourf')) {
      this._ctx.clearRect(0, 0, this._w, this._h);
      this._fieldData = null;
    }
  }

  clearAll() {
    this._ctx.clearRect(0, 0, this._w, this._h);
    this._layers.forEach(l => l.svgGroup?.remove());
    this._layers = [];
    this._fieldData = null;
  }

  /**
   * Add a text title to the map.
   * @param {string} text
   * @param {object} opts  { x, y, color, fontSize, anchor }
   */
  title(text, opts = {}) {
    const {
      x       = this._w / 2,
      y       = 18,
      color   = 'rgba(226,232,240,0.92)',
      fontSize = 14,
      anchor  = 'middle',
    } = opts;
    const NS = this._NS;
    if (!this._titleEl) {
      this._titleEl = document.createElementNS(NS, 'text');
      this._titleEl.setAttribute('class', 'tp-title');
      this._titleEl.setAttribute('font-family', 'system-ui, sans-serif');
      this._svg.appendChild(this._titleEl);
    }
    this._titleEl.setAttribute('x', x);
    this._titleEl.setAttribute('y', y);
    this._titleEl.setAttribute('fill', color);
    this._titleEl.setAttribute('font-size', fontSize);
    this._titleEl.setAttribute('text-anchor', anchor);
    this._titleEl.textContent = text;
    return this;
  }

  /**
   * Tear down: stop animations, remove DOM, disconnect observers.
   */
  dispose() {
    this._activeAnims.forEach(a => a.pause?.());
    this._activeAnims = [];
    this._resizeObs?.disconnect();
    this._clickHandlers = [];
    this._layers.forEach(l => l.svgGroup?.remove());
    this._layers = [];
    this._featureGroups.forEach(fg => fg.svgGroup.remove());
    this._featureGroups = [];
    this._markers.forEach(m => m.svgEl.remove());
    this._markers = [];
    this._svg.remove();
    this._canvas.remove();
    this._tip?.remove();
  }

  _handleResize() {
    const rect = this._el.getBoundingClientRect();
    const w = Math.round(rect.width || this._w);
    const h = Math.round(rect.height || this._h);
    if (w === this._w && h === this._h) return;
    if (w < 10 || h < 10) return;

    this._w = w; this._h = h;
    this._canvas.width  = w;
    this._canvas.height = h;
    this._svg.setAttribute('width',  w);
    this._svg.setAttribute('height', h);

    // Refit projection to new size.  Preserve any custom rotate.
    const rot = this._proj.rotate();
    this._proj.fitSize([w, h], { type: 'Sphere' });
    this._proj.rotate(rot);
    this._path = geoPath().projection(this._proj);

    this._redrawAll();
    this._markers.forEach(m => this._renderMarker(m));
    if (this._titleEl) this._titleEl.setAttribute('x', w / 2);
  }

  /**
   * Refit the projection to a geographic bounding box.
   * Equivalent to cartopy ax.set_extent([lon0, lon1, lat0, lat1]).
   * Triggers a full re-render of all field layers.
   * @param {[number, number, number, number]} extent  [lon0, lon1, lat0, lat1]
   */
  /**
   * Refit the projection to a geographic bounding box and re-render all layers.
   * Equivalent to cartopy ax.set_extent([lon0, lon1, lat0, lat1]).
   * @param {[number, number, number, number]} extent  [lon0, lon1, lat0, lat1]
   */
  setExtent([lon0, lon1, lat0, lat1]) {
    const pad = Math.min(this._w, this._h) * 0.04;
    this._proj.fitExtent(
      [[pad, pad], [this._w - pad, this._h - pad]],
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[lon0, lat0], [lon1, lat0], [lon1, lat1], [lon0, lat1], [lon0, lat0]]],
        },
      },
    );
    this._path = geoPath().projection(this._proj);
    this._redrawAll();
    return this;
  }

  _redrawAll() {
    // 1. Update static SVG elements
    this._sphereEl.setAttribute('d', this._path({ type: 'Sphere' }));
    if (this._gratEl) this._gratEl.setAttribute('d', this._path(geoGraticule()()));

    // 2. Re-rasterize field layers onto canvas
    this._ctx.clearRect(0, 0, this._w, this._h);
    for (const layer of this._layers) {
      if (layer.type === 'pcolormesh' || layer.type === 'contourf') {
        const { lons, lats, field, opts } = layer;
        const pd     = _prepField(lons, lats, field, opts.vmin ?? null, opts.vmax ?? null);
        const levels = layer.type === 'contourf' ? (opts.levels ?? 12) : null;
        this._rasterize(pd, lons, lats,
          resolveColormap(opts.cmap ?? 'viridis'), opts.alpha ?? 0.85, levels);
        this._storeField(lons, lats, pd, opts);  // keep tooltip data fresh
      }
    }

    // 3. Re-render contour SVG paths through updated projection
    for (const layer of this._layers) {
      if (layer.type === 'contour' && layer.svgGroup) {
        layer.svgGroup.remove();
        // Re-run contour render (re-uses stored args)
        const g = this._renderContourSvg(layer.lons, layer.lats, layer.field, layer.opts);
        layer.svgGroup = g;
        this._svg.appendChild(g);
      }
    }

    // 4. Re-render cached GeoJSON features
    for (const fg of this._featureGroups) {
      if (fg.geojson) this._renderFeature(fg);
    }

    // 5. Re-render quiver layers through the new projection
    for (const layer of this._layers) {
      if (layer.type === 'quiver' && layer.qLayer && layer.svgGroup) {
        layer.qLayer.render(layer.svgGroup, p => this._proj(p), this._w);
      }
    }

    // 6. Re-render markers
    for (const m of this._markers) this._renderMarker(m);
  }

  // Re-runs the SVG contour rendering; returns the new <g> element
  _renderContourSvg(lons, lats, field, opts) {
    const {
      levels = 8, cmap = null, color = 'rgba(255,255,255,0.75)',
      alpha = 0.9, vmin = null, vmax = null,
      linewidth = 1.2, smoothFactor = 4, chaikin = 2,
    } = opts;
    const { flat, nlon, nlat, minV, maxV } = _prepFieldFlat(lons, lats, field, vmin, vmax);
    const range = maxV - minV || 1;
    const colorFn = cmap ? resolveColormap(cmap) : null;
    let workFlat = flat, wNlon = nlon, wNlat = nlat;
    if (smoothFactor > 1) {
      ({ field: workFlat, nlon: wNlon, nlat: wNlat } = _upsample(flat, nlat, nlon, smoothFactor));
    }
    const thresholds = Array.isArray(levels)
      ? levels
      : Array.from({ length: levels }, (_, k) => minV + ((k + 0.5) / levels) * range);
    const rings = contours().size([wNlon, wNlat]).thresholds(thresholds)(workFlat);
    const lonRange = lons[lons.length - 1] - lons[0];
    const latRange = lats[lats.length - 1] - lats[0];
    const NS = this._NS;
    const g  = document.createElementNS(NS, 'g');
    g.setAttribute('opacity', String(alpha));
    for (const c of rings) {
      const t = Math.max(0, Math.min(1, (c.value - minV) / range));
      const stroke = colorFn ? `rgb(${colorFn(t).join(',')})` : color;
      for (const poly of c.coordinates) {
        for (let ring of poly) {
          if (chaikin > 0) ring = _chaikin(ring, chaikin);
          const coords = ring.map(([gx, gy]) => [
            lons[0] + (gx / (wNlon - 1)) * lonRange,
            lats[0] + (gy / (wNlat - 1)) * latRange,
          ]);
          const svgEl = document.createElementNS(NS, 'path');
          svgEl.setAttribute('d', this._path({ type: 'LineString', coordinates: coords }));
          svgEl.setAttribute('fill', 'none');
          svgEl.setAttribute('stroke', stroke);
          svgEl.setAttribute('stroke-width', String(linewidth));
          g.appendChild(svgEl);
        }
      }
    }
    return g;
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  /**
   * Rasterise a field to the canvas by inverting the projection pixel-by-pixel.
   * Uses an offscreen canvas at RASTER_CAP resolution, then upscales — so
   * rasterisation cost is bounded regardless of display size.
   */
  _rasterize(pd, lons, lats, colorFn, alpha, levels) {
    const { get, nlon, nlat, minV, maxV } = pd;
    const range = maxV - minV || 1;
    const alphaInt = Math.round(Math.max(0, Math.min(1, alpha)) * 255);

    const rW = Math.min(this._w, RASTER_CAP);
    const rH = Math.round(rW * (this._h / this._w));
    const scaleX = this._w / rW;
    const scaleY = this._h / rH;

    const rCanvas = document.createElement('canvas');
    rCanvas.width  = rW;
    rCanvas.height = rH;
    const rCtx = rCanvas.getContext('2d');
    const img  = rCtx.createImageData(rW, rH);
    const buf  = img.data;

    for (let ry = 0; ry < rH; ry++) {
      for (let rx = 0; rx < rW; rx++) {
        // Map raster pixel centre → display coordinate → geographic [lon, lat]
        const coord = this._proj.invert([(rx + 0.5) * scaleX, (ry + 0.5) * scaleY]);
        if (!coord) continue;
        const [lon, lat] = coord;
        if (!isFinite(lon) || !isFinite(lat)) continue;

        const val = _sample(lon, lat, lons, lats, get, nlon, nlat);
        if (isNaN(val)) continue;

        let t = (val - minV) / range;
        if (levels != null && levels > 1) t = Math.floor(t * levels) / levels;
        const [r, g, b] = colorFn(Math.max(0, Math.min(1, t)));

        const idx = (ry * rW + rx) * 4;
        buf[idx]     = r;
        buf[idx + 1] = g;
        buf[idx + 2] = b;
        buf[idx + 3] = alphaInt;
      }
    }

    rCtx.putImageData(img, 0, 0);
    this._ctx.clearRect(0, 0, this._w, this._h);
    this._ctx.drawImage(rCanvas, 0, 0, this._w, this._h);
  }

  _storeField(lons, lats, pd, opts) {
    this._fieldData = {
      lons, lats,
      get: pd.get, nlon: pd.nlon, nlat: pd.nlat,
      minV: pd.minV, maxV: pd.maxV,
      name:  opts.name  ?? null,
      units: opts.units ?? null,
    };
  }

  _drop(layer) {
    layer.svgGroup?.remove();
  }

  _onMove(e) {
    if (!this._tip || !this._fieldData) return;
    const rect = this._canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const coord = this._proj.invert([px, py]);
    if (!coord) { this._tip.style.display = 'none'; return; }
    const [lon, lat] = coord;
    if (!isFinite(lon) || !isFinite(lat)) { this._tip.style.display = 'none'; return; }

    const fd = this._fieldData;
    const val = _sample(lon, lat, fd.lons, fd.lats, fd.get, fd.nlon, fd.nlat);
    if (isNaN(val)) { this._tip.style.display = 'none'; return; }

    const dec = (Math.abs(fd.maxV - fd.minV) < 2) ? 3 : 2;
    const valStr = val.toFixed(dec) + (fd.units ? ` ${fd.units}` : '');
    const line1  = fd.name ? `${fd.name}: ${valStr}` : valStr;
    this._tip.textContent = `${line1}\nLat ${lat.toFixed(2)}°  Lon ${lon.toFixed(2)}°`;
    this._tip.style.display = 'block';

    let tx = px + 14, ty = py - 8;
    const tw = this._tip.offsetWidth, th = this._tip.offsetHeight;
    if (tx + tw > this._w) tx = px - tw - 8;
    if (ty + th > this._h) ty = py - th;
    if (ty < 0) ty = 4;
    this._tip.style.left = `${tx}px`;
    this._tip.style.top  = `${ty}px`;
  }
}

// ── Module-private helpers ─────────────────────────────────────────────────

/**
 * Bilinear field lookup at geographic (lon, lat).
 * field[j][i] is at (lats[j], lons[i]) — ascending or descending lats both work.
 */
function _sample(lon, lat, lons, lats, get, nlon, nlat) {
  const lonFrac = (lon - lons[0]) / (lons[nlon - 1] - lons[0]);
  const latFrac = (lat - lats[0]) / (lats[nlat - 1] - lats[0]);
  if (lonFrac < 0 || lonFrac > 1 || latFrac < 0 || latFrac > 1) return NaN;

  const gi = lonFrac * (nlon - 1);
  const gj = latFrac * (nlat - 1);
  const i0 = Math.max(0, Math.floor(gi)), i1 = Math.min(i0 + 1, nlon - 1);
  const j0 = Math.max(0, Math.floor(gj)), j1 = Math.min(j0 + 1, nlat - 1);
  const fi = gi - i0, fj = gj - j0;

  const v00 = get(j0, i0), v01 = get(j0, i1);
  const v10 = get(j1, i0), v11 = get(j1, i1);
  if (isNaN(v00) || isNaN(v01) || isNaN(v10) || isNaN(v11)) return NaN;
  return v00*(1-fi)*(1-fj) + v01*fi*(1-fj) + v10*(1-fi)*fj + v11*fi*fj;
}

function _prepField(lons, lats, field, vmin, vmax) {
  const nlon = lons.length, nlat = lats.length;
  const isFlat = !Array.isArray(field[0]) &&
    !(field[0] instanceof Float32Array) && !(field[0] instanceof Float64Array);
  const get = isFlat
    ? (j, i) => field[j * nlon + i]
    : (j, i) => field[j][i];

  let minV = vmin, maxV = vmax;
  if (minV == null || maxV == null) {
    minV = Infinity; maxV = -Infinity;
    for (let j = 0; j < nlat; j++)
      for (let i = 0; i < nlon; i++) {
        const v = get(j, i);
        if (!isNaN(v)) { if (v < minV) minV = v; if (v > maxV) maxV = v; }
      }
  }
  return { get, nlon, nlat, minV: minV ?? 0, maxV: maxV ?? 1 };
}

function _prepFieldFlat(lons, lats, field, vmin, vmax) {
  const { get, nlon, nlat, minV, maxV } = _prepField(lons, lats, field, vmin, vmax);
  const flat = new Float32Array(nlat * nlon);
  for (let j = 0; j < nlat; j++)
    for (let i = 0; i < nlon; i++)
      flat[j * nlon + i] = get(j, i);
  return { flat, nlon, nlat, minV, maxV };
}

function _upsample(flat, nlat, nlon, scale) {
  const nlat2 = (nlat - 1) * scale + 1;
  const nlon2 = (nlon - 1) * scale + 1;
  const out = new Float32Array(nlat2 * nlon2);
  for (let j2 = 0; j2 < nlat2; j2++) {
    const gj = j2 / scale;
    const j0 = Math.min(Math.floor(gj), nlat - 2);
    const fj = gj - j0;
    for (let i2 = 0; i2 < nlon2; i2++) {
      const gi = i2 / scale;
      const i0 = Math.min(Math.floor(gi), nlon - 2);
      const fi = gi - i0;
      out[j2 * nlon2 + i2] =
        flat[ j0      * nlon +  i0   ] * (1-fi)*(1-fj) +
        flat[ j0      * nlon + (i0+1)] *   fi  *(1-fj) +
        flat[(j0+1)   * nlon +  i0   ] * (1-fi)*  fj   +
        flat[(j0+1)   * nlon + (i0+1)] *   fi  *  fj;
    }
  }
  return { field: out, nlat: nlat2, nlon: nlon2 };
}

function _chaikin(ring, iter) {
  let pts = ring;
  const closed = pts[0][0] === pts[pts.length - 1][0] &&
                 pts[0][1] === pts[pts.length - 1][1];
  for (let it = 0; it < iter; it++) {
    const next = [];
    const n = pts.length - 1;
    for (let k = 0; k < n; k++) {
      const [x0, y0] = pts[k], [x1, y1] = pts[k + 1];
      next.push([0.75*x0 + 0.25*x1, 0.75*y0 + 0.25*y1]);
      next.push([0.25*x0 + 0.75*x1, 0.25*y0 + 0.75*y1]);
    }
    if (closed) next.push(next[0]);
    pts = next;
  }
  return pts;
}

/**
 * Colorbar — standalone reusable colorbar widget.
 *
 * Renders an HTMLCanvasElement gradient + tick labels into a container,
 * styled to match terraplot's GeoMap/GeoSphere look.
 *
 * Usage:
 *   const cb = new Colorbar('#legend', {
 *     cmap:  'thermal',
 *     vmin:  -4,
 *     vmax:  +4,
 *     label: '2m Temperature anomaly [°C]',
 *     ticks: 5,
 *   });
 *
 *   cb.update({ vmin: -6, vmax: +6 });   // re-render with new range
 *   cb.dispose();                         // remove from DOM
 */

import { resolveColormap } from './colormaps.js';

const DEFAULTS = {
  width:        220,
  height:       12,
  ticks:        5,
  orientation: 'horizontal',  // 'horizontal' | 'vertical'
  background: 'rgba(0,0,0,0.55)',
  textColor:   '#cbd5e1',
  fontSize:    11,
};

export class Colorbar {
  constructor(container, options = {}) {
    this._el = typeof container === 'string'
      ? document.querySelector(container)
      : container;
    if (!this._el) throw new Error('Colorbar: container element not found');

    this._opts = { ...DEFAULTS, ...options };
    this._build();
    this.update(options);
  }

  _build() {
    const o  = this._opts;
    const NS = this._el.namespaceURI;
    this._el.classList.add('tp-colorbar');
    Object.assign(this._el.style, {
      display:        'inline-flex',
      flexDirection:  o.orientation === 'vertical' ? 'row' : 'column',
      alignItems:     'center',
      gap:            '4px',
      pointerEvents:  'none',
      background:     o.background,
      padding:        '6px 10px',
      borderRadius:   '6px',
      border:         '1px solid rgba(255,255,255,0.12)',
      font:           `${o.fontSize}px/1.4 system-ui, sans-serif`,
      color:          o.textColor,
    });

    this._canvas = document.createElement('canvas');
    this._canvas.width  = o.orientation === 'vertical' ? o.height : o.width;
    this._canvas.height = o.orientation === 'vertical' ? o.width  : o.height;
    Object.assign(this._canvas.style, {
      borderRadius: '3px',
      border:       '1px solid rgba(255,255,255,0.18)',
    });
    this._el.appendChild(this._canvas);

    this._ticksEl = document.createElement('div');
    Object.assign(this._ticksEl.style, {
      display:        'flex',
      justifyContent: 'space-between',
      width:          o.orientation === 'vertical' ? 'auto' : `${o.width}px`,
      flexDirection:  o.orientation === 'vertical' ? 'column-reverse' : 'row',
      height:         o.orientation === 'vertical' ? `${o.width}px` : 'auto',
      fontSize:       `${o.fontSize - 1}px`,
    });
    this._el.appendChild(this._ticksEl);

    this._labelEl = document.createElement('div');
    Object.assign(this._labelEl.style, {
      fontSize:      `${o.fontSize}px`,
      letterSpacing: '0.02em',
      color:         o.textColor,
      whiteSpace:    'nowrap',
    });
    this._el.appendChild(this._labelEl);
  }

  /**
   * Re-render the colorbar with new options.
   * @param {object} opts  any subset of constructor options
   */
  update(opts = {}) {
    Object.assign(this._opts, opts);
    const { cmap, vmin, vmax, label = '', ticks } = this._opts;
    if (cmap == null || vmin == null || vmax == null) return;

    const colorFn = resolveColormap(cmap);
    const ctx = this._canvas.getContext('2d');
    const W = this._canvas.width, H = this._canvas.height;
    ctx.clearRect(0, 0, W, H);

    const horizontal = this._opts.orientation !== 'vertical';
    const span = horizontal ? W : H;
    for (let p = 0; p < span; p++) {
      const t = horizontal ? p / (span - 1) : 1 - p / (span - 1);
      const [r, g, b] = colorFn(t);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      if (horizontal) ctx.fillRect(p, 0, 1, H);
      else            ctx.fillRect(0, p, W, 1);
    }

    this._ticksEl.replaceChildren();
    const decimals = Math.abs(vmax - vmin) < 2 ? 2 : 1;
    for (let i = 0; i < ticks; i++) {
      const v = vmin + (i / (ticks - 1)) * (vmax - vmin);
      const span = document.createElement('span');
      span.textContent = v.toFixed(decimals);
      this._ticksEl.appendChild(span);
    }

    this._labelEl.textContent = label;
    this._labelEl.style.display = label ? 'block' : 'none';
  }

  dispose() {
    this._el.replaceChildren();
    this._el.classList.remove('tp-colorbar');
  }
}

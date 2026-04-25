import { GeoSphere, Features } from 'terraplot';

// ── Synthetic field generators ─────────────────────────────────────────────

function makeGrid(nx, ny, fn) {
  const g = new Float32Array(ny * nx);
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++)
      g[j * nx + i] = fn(i / (nx - 1), j / (ny - 1));
  return g;
}

const NX = 180, NY = 91;
const synLons = Array.from({ length: NX }, (_, i) => -180 + (i / (NX - 1)) * 360);
const synLats = Array.from({ length: NY }, (_, j) =>  90  - (j / (NY - 1)) * 180);

const SYN_FIELDS = {
  temp: {
    label: 'Temperature anomaly (synthetic)',
    cmap: 'RdYlBu_r', vmin: -15, vmax: 15,
    grid: makeGrid(NX, NY, (u, v) => {
      const lat = 90 - v * 180, lon = -180 + u * 360;
      return 12*Math.cos(lat*Math.PI/180)*Math.sin(lat*Math.PI/180)*Math.sin(2*lon*Math.PI/180)
           +  6*Math.sin(3*lon*Math.PI/180)*Math.cos(2*lat*Math.PI/180)
           +  4*Math.cos(5*lon*Math.PI/180)*Math.sin(lat*Math.PI/180)
           -  3*Math.sin(lon*Math.PI/180)*Math.cos(3*lat*Math.PI/180);
    }),
  },
  precip: {
    label: 'Precipitation (synthetic, mm/day)',
    cmap: 'YlGnBu', vmin: 0, vmax: 15,
    grid: makeGrid(NX, NY, (u, v) => {
      const lat = 90 - v * 180, lon = -180 + u * 360;
      return Math.max(0,
        8*Math.pow(Math.cos(lat*Math.PI/180),2)*(0.5+0.5*Math.sin(2*lon*Math.PI/180+1))
       +4*Math.pow(Math.cos(2*lat*Math.PI/180),2)*(0.4+0.6*Math.cos(3*lon*Math.PI/180))
       +3*Math.max(0,Math.cos(lat*Math.PI/180*4))*Math.max(0,Math.sin(lon*Math.PI/180*2+2)));
    }),
  },
  wave: {
    label: 'Geopotential height (synthetic, m)',
    cmap: 'plasma', vmin: 4600, vmax: 5400,
    grid: makeGrid(NX, NY, (u, v) => {
      const lat = 90 - v * 180, lon = -180 + u * 360;
      return 5000
        + 300*Math.cos(3*lon*Math.PI/180)*Math.cos(lat*Math.PI/180)
        + 200*Math.sin(5*lon*Math.PI/180)*Math.cos(2*lat*Math.PI/180)
        + 100*Math.sin(7*lon*Math.PI/180)*Math.sin(lat*Math.PI/180);
    }),
  },
};

// ── Real NCEP/CMAP field catalogue ────────────────────────────────────────

const REAL_FIELDS = {
  t2m_anom: {
    label: 'T2m anomaly vs 1991–2020 (NCEP)',
    url: '/data/t2m_anom.json',
    cmap: 'RdYlBu_r',
  },
  precip: {
    label: 'Precipitation Mar 2026 (CMAP)',
    url: '/data/precip.json',
    cmap: 'YlGnBu',
  },
  precip_anom: {
    label: 'Precip anomaly vs 1991–2020 (CMAP)',
    url: '/data/precip_anom.json',
    cmap: 'RdBu',
  },
};

const ANIM_URL = '/data/t2m_anim.json';

// lazy cache: fieldKey → { lons, lats, field/frames, vmin, vmax }
const realCache = {};
async function loadReal(key) {
  if (realCache[key]) return realCache[key];
  setStatus('loading…');
  const url = key === '__anim' ? ANIM_URL : REAL_FIELDS[key].url;
  const d = await fetch(url).then(r => r.json());
  realCache[key] = d;
  return d;
}

// ── State ─────────────────────────────────────────────────────────────────

let source    = 'syn';    // 'syn' | 'real'
let layerType = 'pcolormesh';
let fieldKey  = 'temp';
let showCoast = false;
let animCtrl  = null;

const globe = new GeoSphere('#globe');

const status    = document.getElementById('status');
const frameInfo = document.getElementById('frame-info');
const frameIdx  = document.getElementById('frame-idx');

function setStatus(msg) { status.textContent = msg; }

// ── Legend ────────────────────────────────────────────────────────────────

const CMAP_CSS = {
  RdYlBu_r: 'linear-gradient(to right,#313695,#4575b4,#74add1,#abd9e9,#e0f3f8,#ffffbf,#fee090,#fdae61,#f46d43,#d73027,#a50026)',
  RdBu:     'linear-gradient(to right,#053061,#2166ac,#4393c3,#92c5de,#d1e5f0,#f7f7f7,#fddbc7,#f4a582,#d6604d,#b2182b,#67001f)',
  YlGnBu:   'linear-gradient(to right,#ffffd9,#edf8b1,#c7e9b4,#7fcdbb,#41b6c4,#1d91c0,#225ea8,#253494,#081d58)',
  plasma:   'linear-gradient(to right,#0d0887,#6a00a8,#b12a90,#e16462,#fca636,#f0f921)',
  viridis:  'linear-gradient(to right,#440154,#31688e,#35b779,#fde725)',
};

function updateLegend({ label, cmap, vmin, vmax }) {
  document.getElementById('legend-title').textContent = label;
  document.getElementById('legend-bar').style.background = CMAP_CSS[cmap] ?? CMAP_CSS.viridis;
  document.getElementById('leg-min').textContent = vmin != null ? (+vmin).toFixed(1) : '';
  document.getElementById('leg-max').textContent = vmax != null ? (+vmax).toFixed(1) : '';
}

// ── Draw ──────────────────────────────────────────────────────────────────

async function draw() {
  if (animCtrl) { animCtrl.stop(); animCtrl = null; }
  frameInfo.style.display = 'none';
  globe.clearAll();

  if (showCoast) {
    globe.addFeature(Features.COASTLINES, {
      url: '/ne_110m.geojson', color: '#94a3b8', opacity: 0.7,
    });
  }

  // ── Animate (always real data) ──────────────────────────────────────────
  if (layerType === 'animate') {
    const compact = await loadReal('__anim');
    animCtrl = globe.animate(compact, {
      type: 'pcolormesh',
      interval: 700,
      layerOptions: { cmap: 'RdYlBu_r', alpha: 0.75, vmin: compact.vmin, vmax: compact.vmax },
      onFrame: (i, frame) => { frameIdx.textContent = frame.coord_value ?? i; },
    });
    frameInfo.style.display = 'block';
    updateLegend({ label: '2m Temp anomaly — 12-month S2S animation (NCEP)', cmap: 'RdYlBu_r', vmin: compact.vmin, vmax: compact.vmax });
    setStatus('animate — NCEP 12 months');
    return;
  }

  // ── Synthetic ──────────────────────────────────────────────────────────
  if (source === 'syn') {
    const f = SYN_FIELDS[fieldKey] ?? SYN_FIELDS.temp;
    globe[layerType](synLons, synLats, f.grid, {
      cmap:   f.cmap,
      alpha:  layerType === 'contour' ? 0.95 : 0.75,
      vmin:   f.vmin,
      vmax:   f.vmax,
      levels: layerType === 'contourf' ? 14 : (layerType === 'contour' ? 10 : undefined),
      color:  layerType === 'contour' ? '#ffffff' : undefined,
    });
    updateLegend({ label: f.label, cmap: f.cmap, vmin: f.vmin, vmax: f.vmax });
    setStatus(`${layerType} · ${fieldKey} · synthetic`);
    return;
  }

  // ── Real NCEP/CMAP ─────────────────────────────────────────────────────
  const meta = REAL_FIELDS[fieldKey] ?? REAL_FIELDS.t2m_anom;
  const d    = await loadReal(fieldKey);
  globe[layerType](d.lons, d.lats, d.field, {
    cmap:   meta.cmap,
    alpha:  layerType === 'contour' ? 0.95 : 0.75,
    vmin:   d.vmin,
    vmax:   d.vmax,
    levels: layerType === 'contourf' ? 14 : (layerType === 'contour' ? 10 : undefined),
    color:  layerType === 'contour' ? '#aaccff' : undefined,
  });
  updateLegend({ label: meta.label, cmap: meta.cmap, vmin: d.vmin, vmax: d.vmax });
  setStatus(`${layerType} · ${fieldKey} · NCEP/CMAP`);
}

// ── UI helpers ────────────────────────────────────────────────────────────

function setLayerType(t) {
  layerType = t;
  document.querySelectorAll('[data-layer]').forEach(b => b.classList.toggle('active', b.dataset.layer === t));
}

function setField(k) {
  fieldKey = k;
  document.querySelectorAll('[data-field]').forEach(b => b.classList.toggle('active', b.dataset.field === k));
}

function setSource(s) {
  source = s;
  document.querySelectorAll('[data-source]').forEach(b => b.classList.toggle('active', b.dataset.source === s));

  // Show/hide the right field buttons
  document.getElementById('fields-syn').style.display  = s === 'syn'  ? '' : 'none';
  document.getElementById('fields-real').style.display = s === 'real' ? '' : 'none';

  // Reset to a sensible field for the new source
  if (s === 'syn')  setField('temp');
  if (s === 'real') setField('t2m_anom');
}

// ── Toolbar events ────────────────────────────────────────────────────────

document.querySelectorAll('[data-source]').forEach(b =>
  b.addEventListener('click', () => { setSource(b.dataset.source); draw(); }));

document.querySelectorAll('[data-layer]').forEach(b =>
  b.addEventListener('click', () => { setLayerType(b.dataset.layer); draw(); }));

document.querySelectorAll('[data-field]').forEach(b =>
  b.addEventListener('click', () => { setField(b.dataset.field); draw(); }));

const coastBtn = document.getElementById('btn-coast');
coastBtn.addEventListener('click', () => {
  showCoast = !showCoast;
  coastBtn.classList.toggle('active', showCoast);
  draw();
});

const spinBtn = document.getElementById('btn-spin');
spinBtn.classList.add('active');
spinBtn.addEventListener('click', () => {
  const on = globe.controls.autoRotate;
  globe.setAutoRotate(!on);
  spinBtn.classList.toggle('active', !on);
});

// ── Init ──────────────────────────────────────────────────────────────────

setSource('syn');
draw();
setStatus('pcolormesh · temperature · synthetic');

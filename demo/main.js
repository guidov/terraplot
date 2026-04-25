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
const lons = Array.from({ length: NX }, (_, i) => -180 + (i / (NX - 1)) * 360);
const lats = Array.from({ length: NY }, (_, j) =>  90  - (j / (NY - 1)) * 180);

const FIELDS = {
  temp: {
    label: 'Temperature anomaly (K)',
    cmap: 'RdYlBu_r',
    grid: makeGrid(NX, NY, (u, v) => {
      const lat = 90 - v * 180;
      const lon = -180 + u * 360;
      return (
        12 * Math.cos(lat * Math.PI / 180) * Math.sin(lat * Math.PI / 180) *
        Math.sin(2 * lon * Math.PI / 180) +
        6  * Math.sin(3 * lon * Math.PI / 180) * Math.cos(2 * lat * Math.PI / 180) +
        4  * Math.cos(5 * lon * Math.PI / 180) * Math.sin(lat * Math.PI / 180) -
        3  * Math.sin(lon * Math.PI / 180) * Math.cos(3 * lat * Math.PI / 180)
      );
    }),
    vmin: -15, vmax: 15,
  },
  precip: {
    label: 'Precipitation (mm/day)',
    cmap: 'YlGnBu',
    grid: makeGrid(NX, NY, (u, v) => {
      const lat = 90 - v * 180;
      const lon = -180 + u * 360;
      return Math.max(0,
        8  * Math.pow(Math.cos(lat * Math.PI / 180), 2) *
        (0.5 + 0.5 * Math.sin(2 * lon * Math.PI / 180 + 1)) +
        4  * Math.pow(Math.cos(2 * lat * Math.PI / 180), 2) *
        (0.4 + 0.6 * Math.cos(3 * lon * Math.PI / 180)) +
        3  * Math.max(0, Math.cos(lat * Math.PI / 180 * 4)) *
        Math.max(0, Math.sin(lon * Math.PI / 180 * 2 + 2))
      );
    }),
    vmin: 0, vmax: 15,
  },
  wave: {
    label: 'Geopotential height (m)',
    cmap: 'plasma',
    grid: makeGrid(NX, NY, (u, v) => {
      const lat = 90 - v * 180;
      const lon = -180 + u * 360;
      return (
        5000 +
        300 * Math.cos(3 * lon * Math.PI / 180) * Math.cos(lat * Math.PI / 180) +
        200 * Math.sin(5 * lon * Math.PI / 180) * Math.cos(2 * lat * Math.PI / 180) +
        100 * Math.sin(7 * lon * Math.PI / 180) * Math.sin(lat * Math.PI / 180)
      );
    }),
    vmin: 4600, vmax: 5400,
  },
};

// ── Animation frames (lead-time steps, S2S style) ─────────────────────────

function makeAnimFrames(nframes = 12) {
  return {
    lons,
    lats,
    frames: Array.from({ length: nframes }, (_, t) => ({
      coord_value: `+${(t + 1) * 7}d`,
      field: makeGrid(NX, NY, (u, v) => {
        const lat = 90 - v * 180;
        const lon = -180 + u * 360;
        const phase = (t / nframes) * 2 * Math.PI;
        return (
          10 * Math.cos(lat * Math.PI / 180) *
          Math.sin(2 * lon * Math.PI / 180 + phase) +
          5  * Math.cos(2 * lat * Math.PI / 180) *
          Math.cos(3 * lon * Math.PI / 180 + phase * 0.7)
        );
      }),
    })),
  };
}

// ── State ─────────────────────────────────────────────────────────────────

let layerType = 'pcolormesh';
let fieldKey  = 'temp';
let showCoast = false;
let animCtrl  = null;

const globe = new GeoSphere('#globe', { autoRotate: true });

const status    = document.getElementById('status');
const frameInfo = document.getElementById('frame-info');
const frameIdx  = document.getElementById('frame-idx');

function setStatus(msg) { status.textContent = msg; }

// ── Legend ────────────────────────────────────────────────────────────────

const CMAP_CSS = {
  RdYlBu_r: 'linear-gradient(to right,#313695,#4575b4,#74add1,#abd9e9,#e0f3f8,#ffffbf,#fee090,#fdae61,#f46d43,#d73027,#a50026)',
  YlGnBu:   'linear-gradient(to right,#ffffd9,#edf8b1,#c7e9b4,#7fcdbb,#41b6c4,#1d91c0,#225ea8,#253494,#081d58)',
  plasma:   'linear-gradient(to right,#0d0887,#6a00a8,#b12a90,#e16462,#fca636,#f0f921)',
  viridis:  'linear-gradient(to right,#440154,#31688e,#35b779,#fde725)',
};

function updateLegend(field) {
  const f = FIELDS[field] ?? FIELDS.temp;
  document.getElementById('legend-title').textContent = f.label;
  document.getElementById('legend-bar').style.background = CMAP_CSS[f.cmap] ?? CMAP_CSS.viridis;
  document.getElementById('leg-min').textContent = f.vmin;
  document.getElementById('leg-max').textContent = f.vmax;
}

// ── Draw ──────────────────────────────────────────────────────────────────

function draw() {
  if (animCtrl) { animCtrl.stop(); animCtrl = null; }
  frameInfo.style.display = 'none';

  globe.clearAll();

  if (showCoast) {
    globe.addFeature(Features.COASTLINES, {
      url: '/ne_110m.geojson',
      color: '#94a3b8',
      opacity: 0.7,
    });
  }

  const f = FIELDS[fieldKey] ?? FIELDS.temp;

  if (layerType === 'animate') {
    const frames = makeAnimFrames(12);
    animCtrl = globe.animate(frames, {
      type: 'pcolormesh',
      interval: 700,
      layerOptions: { cmap: 'RdYlBu_r', alpha: 0.72, vmin: -12, vmax: 12 },
      onFrame: (i, frame) => {
        frameIdx.textContent = `${frame.coord_value ?? i}`;
      },
    });
    frameInfo.style.display = 'block';
    updateLegend('temp');
    setStatus('animate — 12 S2S lead-time steps');
    return;
  }

  globe[layerType](lons, lats, f.grid, {
    cmap:  f.cmap,
    alpha: layerType === 'contour' ? 0.95 : 0.72,
    vmin:  f.vmin,
    vmax:  f.vmax,
    levels: layerType === 'contourf' ? 14 : (layerType === 'contour' ? 10 : undefined),
    color: layerType === 'contour' ? '#ffffff' : undefined,
  });

  updateLegend(fieldKey);
  setStatus(`${layerType} · ${fieldKey}`);
}

// ── Toolbar wiring ────────────────────────────────────────────────────────

function setLayerType(t) {
  layerType = t;
  ['pcolor','contourf','contour','animate'].forEach(k => {
    document.getElementById(`btn-${k === 'pcolor' ? 'pcolor' : k}`).classList.remove('active');
  });
  document.getElementById(`btn-${t === 'pcolormesh' ? 'pcolor' : t}`).classList.add('active');
}

function setField(k) {
  fieldKey = k;
  ['temp','precip','wave'].forEach(x => document.getElementById(`btn-${x}`).classList.remove('active'));
  document.getElementById(`btn-${k}`).classList.add('active');
}

document.getElementById('btn-pcolor').addEventListener('click',   () => { setLayerType('pcolormesh'); draw(); });
document.getElementById('btn-contourf').addEventListener('click', () => { setLayerType('contourf');   draw(); });
document.getElementById('btn-contour').addEventListener('click',  () => { setLayerType('contour');    draw(); });
document.getElementById('btn-animate').addEventListener('click',  () => { setLayerType('animate');    draw(); });

document.getElementById('btn-temp').addEventListener('click',   () => { setField('temp');   draw(); });
document.getElementById('btn-precip').addEventListener('click', () => { setField('precip'); draw(); });
document.getElementById('btn-wave').addEventListener('click',   () => { setField('wave');   draw(); });

document.getElementById('btn-coast').addEventListener('click', () => {
  showCoast = !showCoast;
  document.getElementById('btn-coast').classList.toggle('active', showCoast);
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

draw();
setStatus('pcolormesh · temperature');

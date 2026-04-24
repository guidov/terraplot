# terraplot

**Cartopy-inspired scientific field visualization for 3D browser globes.**

Plot scalar fields, contours, and geographic features directly on a WebGL sphere — with an API that will feel familiar to anyone who has used cartopy + matplotlib.

```bash
npm install terraplot
```

> Three.js is a peer dependency: `npm install three`

---

## Quick start

```javascript
import { GeoSphere, Colormaps, Features } from 'terraplot';

const globe = new GeoSphere('#container', { autoRotate: true });

// Add country borders
globe.addFeature(Features.COASTLINES, { color: '#ffffff', opacity: 0.6 });

// Smooth gradient field (like ax.pcolormesh)
globe.pcolormesh(lons, lats, tempField, {
  cmap: Colormaps.RdYlBu_r,
  alpha: 0.65,
  vmin: -3,
  vmax: 3,
});

// Discrete banded fill (like ax.contourf)
globe.contourf(lons, lats, precipField, {
  cmap: Colormaps.YlGnBu,
  levels: 10,
  alpha: 0.7,
});
```

---

## Input format

```
lons  — 1D array, ascending:          [-180, -179, ..., 180]
lats  — 1D array, ascending or desc:  [90, 89, ..., -90]
field — 2D array field[j][i]
          j = latitude index (matches lats[j])
          i = longitude index (matches lons[i])
        or flat TypedArray (Float32Array) in row-major order
```

Regular lat/lon grids only in v0.1. Gaussian reduced grid and rotated-pole support coming in v0.2.

---

## API

### `new GeoSphere(container, options?)`

| Option | Default | Description |
|--------|---------|-------------|
| `globeTexture` | earth-night.jpg | URL for globe surface texture |
| `bumpTexture` | earth-topology.png | URL for bump map |
| `background` | `'#090912'` | Background color |
| `autoRotate` | `true` | Auto-spin the globe |
| `autoRotateSpeed` | `0.5` | Spin speed |

### `.pcolormesh(lons, lats, field, options?)`

Smooth per-pixel field mapping.

| Option | Default | Description |
|--------|---------|-------------|
| `cmap` | `'viridis'` | Colormap function or name string |
| `alpha` | `0.7` | Opacity 0–1 |
| `vmin` | auto | Colorscale minimum |
| `vmax` | auto | Colorscale maximum |
| `zorder` | `0` | Layer stacking order |

Returns a layer `id` string.

### `.contourf(lons, lats, field, options?)`

Same as `pcolormesh` but quantized into discrete bands. Add `levels` (default 12).

### `.addFeature(feature, options?)`

```javascript
import { Features } from 'terraplot';
globe.addFeature(Features.COASTLINES, { color: '#aaa', opacity: 0.7 });
globe.addFeature(Features.BORDERS,    { color: '#555', opacity: 0.5 });
```

### `.clear(typeOrId)` / `.clearAll()`

Remove layers by type (`'pcolormesh'`, `'contourf'`) or by the id returned from the plot call.

### `.setAutoRotate(bool)`

### `.setPointOfView({ lat, lng, altitude })`

### `.dispose()`

---

## Colormaps

```javascript
import { Colormaps } from 'terraplot';

Colormaps.viridis       // perceptually uniform
Colormaps.plasma
Colormaps.RdYlBu_r      // warm=red, cold=blue — standard temp anomaly
Colormaps.RdBu_r
Colormaps.YlGnBu        // precipitation
Colormaps.BuPu
Colormaps.OrRd
Colormaps.Blues
// ... and more
```

Colormaps are plain functions `(t: 0–1) => [r, g, b]` — pass your own for full control.

---

## Roadmap

| Version | Features |
|---------|----------|
| v0.1 | `pcolormesh`, `contourf`, coastlines/borders, colormaps |
| v0.2 | `contour` isolines, Gaussian reduced grid input, local GeoJSON |
| v0.3 | 2D projection modes (PlateCarree, Mercator), WebWorker field rendering |
| v1.0 | WebGL shader-based rendering, real-time animation API |

---

## License

MIT © Guido Vettoretti

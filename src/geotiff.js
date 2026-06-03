/**
 * geotiff.js — decode a (Cloud-Optimized) GeoTIFF into a terraplot field.
 *
 * Symmetric with unpack.js: the returned object has the same shape as
 * unpackField(), so it drops straight into GeoMap.pcolormesh() / animate():
 *   { lons, lats, field (Float32Array, row-major), nlon, nlat,
 *     name, units, long_name }
 *
 * The `geotiff` package is loaded via a dynamic import() and is declared as an
 * optional peer dependency — it stays out of the main bundle and is only
 * needed by consumers that actually read rasters:
 *   npm install geotiff
 *
 * Assumes a geographic (EPSG:4326) raster, matching pyterraplot.to_cog output.
 *
 * Example:
 *   const payload = await unpackGeoTiff(arrayBufferOrUrl, { units: '°C' });
 *   map.pcolormesh(payload.lons, payload.lats, payload.field, { cmap: 'RdBu_r' });
 */

/**
 * @param {ArrayBuffer|Uint8Array|string} source  raw GeoTIFF bytes, or a URL to fetch
 * @param {object} [meta]  { name, units, long_name } display metadata
 * @returns {Promise<{lons: number[], lats: number[], field: Float32Array,
 *                     nlon: number, nlat: number,
 *                     name: string, units: string, long_name: string}>}
 */
export async function unpackGeoTiff(source, meta = {}) {
  const { fromArrayBuffer } = await import('geotiff');

  let buffer;
  if (typeof source === 'string') {
    const res = await fetch(source);
    if (!res.ok) throw new Error(`unpackGeoTiff: HTTP ${res.status} fetching ${source}`);
    buffer = await res.arrayBuffer();
  } else if (source instanceof Uint8Array) {
    buffer = source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
  } else {
    buffer = source; // ArrayBuffer
  }

  const tiff  = await fromArrayBuffer(buffer);
  const image = await tiff.getImage();
  const nlon  = image.getWidth();
  const nlat  = image.getHeight();
  // [west, south, east, north] in the image CRS (assumed geographic)
  const [west, south, east, north] = image.getBoundingBox();

  const rasters = await image.readRasters({ interleave: false });
  const band    = rasters[0];            // first band, row-major, top-left origin
  const nodata  = image.getGDALNoData(); // number | null

  // Pixel-centre coordinates. Row 0 is the north edge → lats descend.
  const dLon = (east - west)   / nlon;
  const dLat = (north - south) / nlat;
  const lons = Array.from({ length: nlon }, (_, i) => west  + (i + 0.5) * dLon);
  const lats = Array.from({ length: nlat }, (_, j) => north - (j + 0.5) * dLat);

  // Flat row-major Float32Array, NaN for nodata — matches unpackField().
  const field = new Float32Array(nlat * nlon);
  for (let k = 0; k < field.length; k++) {
    const v = band[k];
    field[k] = (nodata !== null && v === nodata) ? NaN : v;
  }

  return {
    lons, lats, field, nlon, nlat,
    name:      meta.name      || 'geotiff',
    units:     meta.units     || '',
    long_name: meta.long_name || meta.name || 'GeoTIFF',
  };
}

/**
 * Min/max over the finite values of a field — for auto colour-scaling an
 * unknown raster. Accepts a flat TypedArray/Array or a nested field[j][i].
 *
 * @param {Float32Array|number[]|number[][]} field
 * @returns {[number, number]} [vmin, vmax]
 */
export function fieldExtent(field) {
  let lo = Infinity, hi = -Infinity;
  const scan = (v) => {
    if (v == null || Number.isNaN(v)) return;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  };
  if (Array.isArray(field) && Array.isArray(field[0])) {
    for (const row of field) for (const v of row) scan(v);
  } else {
    for (let k = 0; k < field.length; k++) scan(field[k]);
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [0, 1];
  if (lo === hi) return [lo - 1, hi + 1];
  return [lo, hi];
}

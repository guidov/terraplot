/**
 * unpack.js — decompress and parse binary field blobs from pyterraplot.binary.
 *
 * Uses the browser-native DecompressionStream API (gzip) — no library needed.
 * Supported: Chrome 80+, Firefox 113+, Safari 16.4+.
 *
 * Both functions are async (return Promises) due to the streaming decompress step.
 * In a <script type="module"> you can use top-level await directly.
 *
 * Example (single field):
 *   const payload = await unpackField(B64_STRING);
 *   // payload: { lons, lats, field (Float32Array), nlon, nlat, name, units, long_name }
 *   map.pcolormesh(payload.lons, payload.lats, payload.field, { cmap: 'viridis' });
 *
 * Example (animation frames):
 *   const data = await unpackFrames(B64_STRING);
 *   // data: { lons, lats, nlon, nlat, name, units, long_name,
 *   //         frames: [{ field (Float32Array), coord_value, frame }, ...] }
 *   map.animate(data, { type: 'pcolormesh', interval: 800 });
 */

const MAGIC_FIELD  = 0x44_4C_50_54;  // "TPLD"
const MAGIC_FRAMES = 0x46_4C_50_54;  // "TPLF"

/**
 * Decode a single-field binary blob (pyterraplot.binary.pack_field output).
 *
 * @param {string} b64  Base64-encoded gzip-compressed binary
 * @returns {Promise<{lons: number[], lats: number[], field: Float32Array,
 *                    nlon: number, nlat: number,
 *                    name: string, units: string, long_name: string}>}
 */
export async function unpackField(b64) {
  const buf  = await _decompress(b64);
  const view = new DataView(buf);
  let off = 0;

  const magic   = view.getUint32(off, true); off += 4;
  /* version */   view.getUint32(off, true); off += 4;
  const nlon    = view.getUint32(off, true); off += 4;
  const nlat    = view.getUint32(off, true); off += 4;

  if (magic !== MAGIC_FIELD) {
    throw new Error(`unpackField: unexpected magic 0x${magic.toString(16)} (expected TPLD)`);
  }

  const lons  = Array.from(new Float32Array(buf.slice(off, off + nlon * 4)));  off += nlon * 4;
  const lats  = Array.from(new Float32Array(buf.slice(off, off + nlat * 4)));  off += nlat * 4;
  // flat row-major Float32Array: field[j*nlon + i] corresponds to (lats[j], lons[i])
  const field = new Float32Array(buf.slice(off, off + nlat * nlon * 4));        off += nlat * nlon * 4;

  const metaLen = view.getUint32(off, true);  off += 4;
  const meta    = JSON.parse(_decode(new Uint8Array(buf, off, metaLen)));

  return { lons, lats, field, nlon, nlat, ...meta };
}

/**
 * Decode a multi-frame binary blob (pyterraplot.binary.pack_frames output).
 *
 * Returns in compact format compatible with GeoSphere.animate() and GeoMap.animate():
 *   { lons, lats, frames: [{ field: Float32Array, coord_value, frame }] }
 *
 * Each frame.field is a flat Float32Array view — no copies made.
 *
 * @param {string} b64  Base64-encoded gzip-compressed binary
 * @returns {Promise<{lons, lats, nlon, nlat, frames, name, units, long_name}>}
 */
export async function unpackFrames(b64) {
  const buf  = await _decompress(b64);
  const view = new DataView(buf);
  let off = 0;

  const magic    = view.getUint32(off, true); off += 4;
  /* version */    view.getUint32(off, true); off += 4;
  const nlon     = view.getUint32(off, true); off += 4;
  const nlat     = view.getUint32(off, true); off += 4;
  const nFrames  = view.getUint32(off, true); off += 4;

  if (magic !== MAGIC_FRAMES) {
    throw new Error(`unpackFrames: unexpected magic 0x${magic.toString(16)} (expected TPLF)`);
  }

  const lons = Array.from(new Float32Array(buf.slice(off, off + nlon * 4)));  off += nlon * 4;
  const lats = Array.from(new Float32Array(buf.slice(off, off + nlat * 4)));  off += nlat * 4;

  // Coord values: uint16 len-prefix + utf-8 bytes, packed into one buffer
  const coordBufLen = view.getUint32(off, true);  off += 4;
  const coordBuf    = new Uint8Array(buf, off, coordBufLen);
  const coordValues = [];
  let coff = 0;
  for (let k = 0; k < nFrames; k++) {
    const strLen = coordBuf[coff] | (coordBuf[coff + 1] << 8);  coff += 2;
    coordValues.push(_decode(coordBuf.slice(coff, coff + strLen)));
    coff += strLen;
  }
  off += coordBufLen;

  // All frames packed contiguously as float32 — slice into per-frame views
  const frameSize = nlat * nlon;
  const allFields = new Float32Array(buf.slice(off, off + nFrames * frameSize * 4));
  off += nFrames * frameSize * 4;

  const metaLen = view.getUint32(off, true);  off += 4;
  const meta    = JSON.parse(_decode(new Uint8Array(buf, off, metaLen)));

  const frames = Array.from({ length: nFrames }, (_, k) => ({
    field:       allFields.subarray(k * frameSize, (k + 1) * frameSize),
    coord_value: coordValues[k],
    frame:       k,
  }));

  return { lons, lats, nlon, nlat, frames, ...meta };
}

// ── internals ──────────────────────────────────────────────────────────────────

async function _decompress(b64) {
  // atob → Uint8Array (handles payloads up to ~64 MB safely in modern browsers)
  const binary = atob(b64);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const ds = new DecompressionStream('gzip');
  const writer = ds.writable.getWriter();
  writer.write(bytes);
  writer.close();
  return new Response(ds.readable).arrayBuffer();
}

const _decode = (bytes) => new TextDecoder().decode(bytes);

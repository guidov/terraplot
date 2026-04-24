import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FieldLayer } from './FieldLayer.js';
import { FEATURE_URLS } from './features.js';

const GLOBE_RADIUS = 100;

const DEFAULTS = {
  globeTexture: 'https://unpkg.com/three-globe/example/img/earth-night.jpg',
  bumpTexture:  'https://unpkg.com/three-globe/example/img/earth-topology.png',
  background:   '#090912',
  autoRotate:   true,
  autoRotateSpeed: 0.5,
};

export class GeoSphere {
  #scene;
  #camera;
  #renderer;
  #controls;
  #layers = [];      // { id, type, layer }
  #featureLines = [];
  #rafId = null;

  constructor(container, options = {}) {
    const el = typeof container === 'string'
      ? document.querySelector(container)
      : container;
    if (!el) throw new Error('terraplot: container element not found');

    const opts = { ...DEFAULTS, ...options };

    // Renderer
    this.#renderer = new THREE.WebGLRenderer({ antialias: true });
    this.#renderer.setPixelRatio(window.devicePixelRatio);
    this.#renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(this.#renderer.domElement);

    // Scene + background
    this.#scene = new THREE.Scene();
    this.#scene.background = new THREE.Color(opts.background);

    // Camera
    this.#camera = new THREE.PerspectiveCamera(50, el.clientWidth / el.clientHeight, 0.1, 50000);
    this.#camera.position.z = GLOBE_RADIUS * 2.5;

    // Lighting
    this.#scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const sun = new THREE.DirectionalLight(0xffffff, 0.6);
    sun.position.set(300, 200, 300);
    this.#scene.add(sun);

    // Globe mesh
    const loader = new THREE.TextureLoader();
    const globeGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 72, 36);
    const globeMat = new THREE.MeshPhongMaterial({
      map:        loader.load(opts.globeTexture),
      bumpMap:    loader.load(opts.bumpTexture),
      bumpScale:  0.5,
      specular:   new THREE.Color(0x222222),
      shininess:  8,
    });
    this.#scene.add(new THREE.Mesh(globeGeo, globeMat));

    // Orbit controls
    this.#controls = new OrbitControls(this.#camera, this.#renderer.domElement);
    this.#controls.autoRotate      = opts.autoRotate;
    this.#controls.autoRotateSpeed = opts.autoRotateSpeed;
    this.#controls.enableDamping   = true;
    this.#controls.dampingFactor   = 0.05;
    this.#controls.minDistance     = GLOBE_RADIUS * 1.15;
    this.#controls.maxDistance     = GLOBE_RADIUS * 6;

    // Resize
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth, h = el.clientHeight;
      this.#camera.aspect = w / h;
      this.#camera.updateProjectionMatrix();
      this.#renderer.setSize(w, h);
    });
    ro.observe(el);

    this.#loop();
  }

  #loop() {
    this.#rafId = requestAnimationFrame(() => this.#loop());
    this.#controls.update();
    this.#renderer.render(this.#scene, this.#camera);
  }

  // ── Camera ──────────────────────────────────────────────────────────────────

  setPointOfView({ lat = 0, lng = 0, altitude = 2.5 } = {}) {
    const phi   = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const r     = GLOBE_RADIUS * altitude;
    this.#camera.position.set(
      -r * Math.sin(phi) * Math.cos(theta),
       r * Math.cos(phi),
       r * Math.sin(phi) * Math.sin(theta),
    );
    this.#camera.lookAt(0, 0, 0);
    this.#controls.update();
    return this;
  }

  setAutoRotate(enabled) {
    this.#controls.autoRotate = enabled;
    return this;
  }

  // ── Field layers ─────────────────────────────────────────────────────────────

  /**
   * Smooth gradient field — equivalent to ax.pcolormesh() in cartopy.
   * lons: 1D array  [-180 … 180]
   * lats: 1D array  [90 … -90] or [-90 … 90]
   * field: 2D array field[j][i] or flat TypedArray (row-major, lat-major)
   */
  pcolormesh(lons, lats, field, options = {}) {
    return this.#addField('pcolormesh', lons, lats, field, { ...options, levels: null });
  }

  /**
   * Discrete banded contour fill — equivalent to ax.contourf() in cartopy.
   * Same signature as pcolormesh; options.levels controls number of bands (default 12).
   */
  contourf(lons, lats, field, options = {}) {
    const levels = options.levels ?? 12;
    return this.#addField('contourf', lons, lats, field, { ...options, levels });
  }

  #addField(type, lons, lats, field, options) {
    const layer = new FieldLayer(lons, lats, field, options, GLOBE_RADIUS);
    this.#scene.add(layer.mesh);
    const id = `${type}_${Date.now()}`;
    this.#layers.push({ id, type, layer });
    return id;
  }

  // ── Feature lines ────────────────────────────────────────────────────────────

  /**
   * Add a geographic feature (coastlines, borders).
   * Equivalent to ax.add_feature(cartopy.feature.COASTLINES).
   */
  addFeature(feature, options = {}) {
    const { color = '#ffffff', linewidth = 0.6, opacity = 0.7 } = options;
    const url = FEATURE_URLS[feature];
    if (!url) { console.warn(`terraplot: unknown feature "${feature}"`); return this; }

    fetch(url)
      .then(r => r.json())
      .then(geojson => {
        const lines = geojsonToLines(geojson, GLOBE_RADIUS * 1.001);
        const mat = new THREE.LineBasicMaterial({
          color,
          opacity,
          transparent: opacity < 1,
          linewidth,  // only works on WebGL2 with certain extensions
        });
        const mesh = new THREE.LineSegments(lines, mat);
        this.#scene.add(mesh);
        this.#featureLines.push(mesh);
      })
      .catch(e => console.warn('terraplot: failed to load feature', feature, e));

    return this;
  }

  // ── Layer management ─────────────────────────────────────────────────────────

  /** Remove all layers of a given type ('pcolormesh', 'contourf') or by id. */
  clear(typeOrId) {
    this.#layers = this.#layers.filter(({ id, type, layer }) => {
      if (id === typeOrId || type === typeOrId) {
        this.#scene.remove(layer.mesh);
        layer.dispose();
        return false;
      }
      return true;
    });
    return this;
  }

  clearAll() {
    for (const { layer } of this.#layers) {
      this.#scene.remove(layer.mesh);
      layer.dispose();
    }
    this.#layers = [];
    return this;
  }

  dispose() {
    cancelAnimationFrame(this.#rafId);
    this.clearAll();
    this.#renderer.dispose();
  }

  // Expose for advanced Three.js usage
  get scene()       { return this.#scene; }
  get camera()      { return this.#camera; }
  get controls()    { return this.#controls; }
  get globeRadius() { return GLOBE_RADIUS; }
}

// ── GeoJSON → Three.js line geometry ─────────────────────────────────────────

function latLngToXyz(lat, lng, r) {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return [
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  ];
}

function geojsonToLines(geojson, r) {
  const positions = [];

  const addRing = (ring) => {
    for (let i = 0; i < ring.length - 1; i++) {
      const [lng1, lat1] = ring[i];
      const [lng2, lat2] = ring[i + 1];
      positions.push(...latLngToXyz(lat1, lng1, r));
      positions.push(...latLngToXyz(lat2, lng2, r));
    }
  };

  const addGeometry = (geom) => {
    if (!geom) return;
    if (geom.type === 'Polygon') {
      geom.coordinates.forEach(addRing);
    } else if (geom.type === 'MultiPolygon') {
      geom.coordinates.forEach(poly => poly.forEach(addRing));
    } else if (geom.type === 'LineString') {
      addRing(geom.coordinates);
    } else if (geom.type === 'MultiLineString') {
      geom.coordinates.forEach(addRing);
    }
  };

  if (geojson.type === 'FeatureCollection') {
    geojson.features.forEach(f => addGeometry(f.geometry));
  } else if (geojson.type === 'Feature') {
    addGeometry(geojson.geometry);
  } else {
    addGeometry(geojson);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return geo;
}

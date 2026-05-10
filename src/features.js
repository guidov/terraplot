// Named feature constants — mirrors cartopy.feature
export const Features = {
  COASTLINES: 'coastlines',
  BORDERS:    'borders',
  LAND:       'land',
  OCEAN:      'ocean',
  RIVERS:     'rivers',
};

// Natural Earth CDN via jsdelivr (stable, versioned, fast CDN).
// 110m = coarse global overview; 50m = medium regional; 10m = detailed local.
// Use the _resolution option on addFeature() to pick a tier:
//   addFeature('coastlines', { resolution: '50m' })
const NE_BASE = 'https://cdn.jsdelivr.net/npm/world-atlas@2/';

// world-atlas@2 ships 110m and 50m as TopoJSON; we use the GeoJSON from
// naturalearth-land directly for simplicity at global scale.
// For web-first use the jsDelivr-hosted geojson from the ne_* packages.
const NE_GEOJSON = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson';

export const FEATURE_URLS = {
  coastlines: `${NE_GEOJSON}/ne_110m_coastline.geojson`,
  borders:    `${NE_GEOJSON}/ne_110m_admin_0_boundary_lines_land.geojson`,
  rivers:     `${NE_GEOJSON}/ne_110m_rivers_lake_centerlines.geojson`,
};

// Higher-resolution alternatives — pass as url option to addFeature()
export const FEATURE_URLS_50M = {
  coastlines: `${NE_GEOJSON}/ne_50m_coastline.geojson`,
  borders:    `${NE_GEOJSON}/ne_50m_admin_0_boundary_lines_land.geojson`,
  rivers:     `${NE_GEOJSON}/ne_50m_rivers_lake_centerlines.geojson`,
};

export const FEATURE_URLS_10M = {
  coastlines: `${NE_GEOJSON}/ne_10m_coastline.geojson`,
  borders:    `${NE_GEOJSON}/ne_10m_admin_0_boundary_lines_land.geojson`,
};

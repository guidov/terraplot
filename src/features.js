// Named feature constants — mirrors cartopy.feature
export const Features = {
  COASTLINES: 'coastlines',
  BORDERS:    'borders',
  LAND:       'land',
  OCEAN:      'ocean',
};

// Default GeoJSON sources (110m resolution — good for global views)
export const FEATURE_URLS = {
  coastlines: 'https://unpkg.com/three-globe/example/dataset/ne_110m_admin_0_countries.geojson',
  borders:    'https://unpkg.com/three-globe/example/dataset/ne_110m_admin_0_countries.geojson',
};


/**
 * Default map theme configuration
 * Defines styling for all map elements (device, spots, trails, etc.)
 * Dynamic values (colors from baseTheme) are applied via createDefaultMapTheme()
 */
const MAP_THEME_DEFAULT = {
  radius: {
    strokeColor: 'transparent',
    fill: 'rgba(0, 0, 0, 0.2)',
    strokeWidth: 2,
  },
  device: {
    strokeColor: '#ffffff',
    fill: '#ffffff',
    strokeWidth: 1,
    arrowSize: 18,
    markerSize: 50,
    markerBorderRadius: 25,
    circleBackground: '#4e4e4e00',
    circleBorderRadius: 999,
    shadow: {
      color: 'black',
      offset: { width: 2, height: 1 },
      opacity: 0.6,
      radius: 4,
      elevation: 1,
    },
  },
  spot: {
    strokeColor: 'transparent',
    fill: '#ffffff',
    strokeWidth: 1.5,
    size: 20,
    borderRadius: 4,
    borderWidth: 0.5,
    backgroundColor: '#e0e0e0ff',
    imageBorderRadius: 2,
    imageBackgroundColor: '#000',
    heightOffset: 7,
    offsetX: 10,
    offsetY: 13.5,
  },
  discovery: {
    strokeColor: 'transparent',
    fill: '#ffffff',
    strokeWidth: 1.5,
  },
  clue: {
    strokeColor: '#ffffff',
    fill: 'transparent',
    strokeWidth: 1.5,
  },
  trail: {
    strokeColor: '#ffffff73',
    strokeWidth: 0.5,
  },
  snap: {
    strokeColor: '#ffffff',
    strokeWidth: 1,
    shadowColor: 'black',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  scanner: {
    strokeColor: '#ffffff',
    fill: '#ffffff3a',
    strokeWidth: 1,
  },
  canvas: {
    imageOpacity: 1
  },
  surface: {
    imageOpacity: 1,
    noise: {
      scaleThreshold: 1.0,
      scaleRange: 1.0,
      maxOpacity: 0.3,
      baseFrequency: 0.65,
      // How strongly turbulence displaces image pixels — higher = more abstract color bleed
      displacementScale: 50,
    },
  },
  compass: {
    color: '#ffffff',
    fontSize: 24,
  },
  center: {
    fill: '#a5a5a58c',
  },
  toolbar: {
    backgroundColor: '#00000080',
    borderRadius: 8,
    padding: 8,
    gap: 8,
  }
} as const

export type MapTheme = typeof MAP_THEME_DEFAULT

export const getMapThemeDefaults = () => MAP_THEME_DEFAULT
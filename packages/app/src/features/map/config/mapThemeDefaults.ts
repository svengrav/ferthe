
/**
 * Default map theme configuration
 * Defines styling for all map elements (device, spots, trails, etc.)
 * Dynamic values (colors from baseTheme) are applied via createDefaultMapTheme()
 */
const MAP_THEME_DEFAULT = {
  radius: {
    strokeColor: '#000',
    fill: 'rgba(0, 0, 0, 0.2)',
    strokeWidth: 2,
  },
  device: {
    strokeColor: '#ffffff',
    fill: '#ffffff',
    strokeWidth: 1.5,
    arrowSize: 18,
    markerSize: 50,
    markerBorderRadius: 25,
    circleBackground: '#4e4e4e48',
  },
  spot: {
    strokeColor: '#000000',
    fill: '#ffffff',
    strokeWidth: 1.5,
    size: 15,
    borderRadius: 4,
    borderWidth: 0.5,
    backgroundColor: '#000000ff',
    imageBorderRadius: 2,
    imageBackgroundColor: '#000',
    heightOffset: 7,
    offsetX: 10,
    offsetY: 13.5,
  },
  discovery: {
    strokeColor: '#000000',
    fill: '#ffffff',
    strokeWidth: 1.5,
  },
  clue: {
    strokeColor: '#000000',
    fill: '#ffffff',
    strokeWidth: 1.5,
  },
  trail: {
    strokeColor: '#ffffff73',
    strokeWidth: 0.5,
  },
  snap: {
    strokeColor: '#ffffff',
    strokeWidth: 1,
    strokeDash: [1, 2] as number[]
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
    imageOpacity: 1
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
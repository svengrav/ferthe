/**
 * Central map configuration
 * Consolidates all map-related constants for canvas, surface, overview, and zoom behavior
 * Future enhancement: can be extended with trail-specific overrides
 */
const MAP_DEFAULT = {
  // Canvas: device-centered map (canvas mode / navigation)
  canvas: {
    // Canvas pixel dimensions (1000x1000px default)
    width: 1000,
    height: 1000,
    // Geo-radius in meters shown in canvas view (adaptively calculated per trail)
    radiusMeters: 1000,
    // Scale limits (dynamically calculated on trail load, these are fallback defaults)
    scale: {
      init: 1,
      min: 0.2,
      max: 5,  // Conservative max to prevent extreme zoom before trail loads
    },
  },

  // Surface: full trail map display (trail map background)
  // Note: surface has no scale - it uses absolute layout positioning (left/top/width/height)

  // Overview: preview/overview mode (full trail with zoom/pan)
  overview: {
    scale: {
      init: 1,
      min: 0.5,
      max: 3,
    },
    defaultSize: 800,
    maxDimension: 1000,
    margin: 20,
  },

  // Zoom detail level (max detail zoom shows max 50m of trail)
  zoom: {
    maxMeters: 50,
  },

  // Scanner detection radius in meters
  radius: 3000,

  // Initial canvas scale: used to calculate initial zoom on trail load
  initialViewRadius: 1000,
}

export type MapSpecification = typeof MAP_DEFAULT

export const getMapDefaults = () => MAP_DEFAULT
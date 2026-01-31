
export const MAP_DEFAULT = {
  radius: 3000,
  initialViewRadius: 1000,
  boundary: {
    northEast: { lat: 0, lon: 0 },
    southWest: { lat: 0, lon: 0 },
  },
  viewport: {
    width: 1000,
    height: 1000,
  },
  containerSize: {
    width: 550,
    height: 550,
  },
  scale: {
    init: 1,
    min: 0.5,
    max: 4,
  },
  region: {
    center: { lat: 0, lon: 0 },
    radius: 3000,
  },
}

export type MapSpecification = typeof MAP_DEFAULT
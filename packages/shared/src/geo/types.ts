export interface GeoLocation {
  lat: number
  lon: number
}

export interface GeoRegion {
  center: GeoLocation
  radius: number
}

export interface GeoBoundary {
  northEast: GeoLocation
  southWest: GeoLocation
}

export interface GeoDirection {
  bearing: number
  direction: number // Changed from bearingNomalized
  directionShort: GeoCardinalDirection
  directionLong: GeoCardinalDirectionName
}

export type GeoCardinalDirection = keyof typeof CARDINAL_DEGREES
export type GeoCardinalDirectionName = 'north' | 'northeast' | 'east' | 'southeast' | 'south' | 'southwest' | 'west' | 'northwest'

export const CARDINAL_DEGREES = {
  N: 0,
  NE: 45,
  E: 90,
  SE: 135,
  S: 180,
  SW: 225,
  W: 270,
  NW: 315,
} as const

export const CARDINAL_DIRECTIONS: GeoCardinalDirection[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
export const CARDINAL_DIRECTION_NAMES: GeoCardinalDirectionName[] = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest']

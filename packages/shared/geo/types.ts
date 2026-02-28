import { z } from 'zod'

// ──────────────────────────────────────────────────────────────
// Zod Schemas
// ──────────────────────────────────────────────────────────────

export const GeoLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
})

export const GeoRegionSchema = z.object({
  center: GeoLocationSchema,
  radius: z.number().positive(),
})

export const GeoBoundarySchema = z.object({
  northEast: GeoLocationSchema,
  southWest: GeoLocationSchema,
})

export const GeoDirectionSchema = z.object({
  bearing: z.number().min(0).max(360),
  direction: z.number().min(0).max(360),
  directionShort: z.enum(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']),
  directionLong: z.enum(['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest']),
})

// ──────────────────────────────────────────────────────────────
// TypeScript Types (Inferred from Zod)
// ──────────────────────────────────────────────────────────────

export type GeoLocation = z.infer<typeof GeoLocationSchema>
export type GeoRegion = z.infer<typeof GeoRegionSchema>
export type GeoBoundary = z.infer<typeof GeoBoundarySchema>
export type GeoDirection = z.infer<typeof GeoDirectionSchema>

export type GeoCardinalDirection = GeoDirection['directionShort']
export type GeoCardinalDirectionName = GeoDirection['directionLong']

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

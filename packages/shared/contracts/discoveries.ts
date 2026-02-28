import type { GeoLocation } from '@shared/geo/index.ts'
import { GeoLocationSchema } from '@shared/geo/types.ts'
import { z } from 'zod'
import { AccountContext } from './accounts.ts'
import { DiscoveryProfile, DiscoveryProfileUpdateData } from './discoveryProfile.ts'
import { ImageReferenceSchema } from './images.ts'
import { QueryOptions, Result } from './results.ts'
import { RatingSummary, Spot, SpotRating } from "./spots.ts"
import { TrailStats } from './trails.ts'

// ──────────────────────────────────────────────────────────────
// Zod Schemas (Source of Truth)
// ──────────────────────────────────────────────────────────────

/**
 * Location with direction schema
 */
export const LocationWithDirectionSchema = z.object({
  location: GeoLocationSchema,
  direction: z.number().optional(),
})

/**
 * Discovery snap schema
 */
export const DiscoverySnapSchema = z.object({
  distance: z.number(),
  intensity: z.number(),
})

/**
 * Discovery schema
 */
export const DiscoverySchema = z.object({
  id: z.string(),
  accountId: z.string(),
  spotId: z.string(),
  trailId: z.string(),
  discoveredAt: z.date(),
  scanEventId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

/**
 * Discovery location record schema
 */
export const DiscoveryLocationRecordSchema = z.object({
  createdAt: z.date(),
  locationWithDirection: LocationWithDirectionSchema,
  snap: DiscoverySnapSchema.optional(),
  discoveries: z.array(DiscoverySchema),
})

/**
 * Welcome discovery result schema
 */
export const WelcomeDiscoveryResultSchema = z.object({
  discovery: DiscoverySchema,
  spot: z.any(), // Spot - already migrated
})

/**
 * Discovery stats schema
 */
export const DiscoveryStatsSchema = z.object({
  discoveryId: z.string(),
  rank: z.number().int(),
  totalDiscoverers: z.number().int(),
  trailPosition: z.number().int(),
  trailTotal: z.number().int(),
  timeSinceLastDiscovery: z.number().optional(),
  distanceFromLastDiscovery: z.number().optional(),
})

/**
 * Clue source enum
 */
export const ClueSourceSchema = z.enum(['preview', 'scanEvent'])

/**
 * Clue schema
 */
export const ClueSchema = z.object({
  id: z.string(),
  spotId: z.string(),
  trailId: z.string().optional(),
  location: GeoLocationSchema,
  source: ClueSourceSchema,
  discoveryRadius: z.number(),
  image: z.object({
    micro: ImageReferenceSchema.optional(),
    blurred: ImageReferenceSchema.optional(),
  }).optional(),
})

/**
 * Discovery trail schema
 */
export const DiscoveryTrailSchema = z.object({
  createdAt: z.date().optional(),
  trail: z.any().optional(), // Trail - already migrated
  clues: z.array(ClueSchema),
  previewClues: z.array(ClueSchema).optional(),
  spots: z.array(z.any()), // DiscoverySpot - extends Spot, use interface
  discoveries: z.array(DiscoverySchema),
})

/**
 * Discovery content visibility enum
 */
export const DiscoveryContentVisibilitySchema = z.enum(['private', 'public'])

/**
 * Discovery content schema
 */
export const DiscoveryContentSchema = z.object({
  id: z.string(),
  discoveryId: z.string(),
  accountId: z.string(),
  image: ImageReferenceSchema.optional(),
  comment: z.string().optional(),
  visibility: DiscoveryContentVisibilitySchema,
  createdAt: z.date(),
  updatedAt: z.date(),
})

// ──────────────────────────────────────────────────────────────
// TypeScript Types (Inferred from Zod Schemas)
// ──────────────────────────────────────────────────────────────

export type LocationWithDirection = z.infer<typeof LocationWithDirectionSchema>
export type DiscoverySnap = z.infer<typeof DiscoverySnapSchema>
export type Discovery = z.infer<typeof DiscoverySchema>
export type DiscoveryLocationRecord = z.infer<typeof DiscoveryLocationRecordSchema>
export type WelcomeDiscoveryResult = z.infer<typeof WelcomeDiscoveryResultSchema>
export type DiscoveryStats = z.infer<typeof DiscoveryStatsSchema>
export type ClueSource = z.infer<typeof ClueSourceSchema>
export type Clue = z.infer<typeof ClueSchema>
export type DiscoveryTrail = z.infer<typeof DiscoveryTrailSchema>
export type DiscoveryContentVisibility = z.infer<typeof DiscoveryContentVisibilitySchema>
export type DiscoveryContent = z.infer<typeof DiscoveryContentSchema>

/**
 * Request schema for creating or updating discovery content
 */
export const UpsertDiscoveryContentRequestSchema = z.object({
  imageUrl: z.string().optional(),
  comment: z.string().optional(),
  visibility: DiscoveryContentVisibilitySchema.optional(),
})

export type UpsertDiscoveryContentRequest = z.infer<typeof UpsertDiscoveryContentRequestSchema>

/**
 * Combines a Spot with its Discovery metadata.
 * Extends Spot with discovery context (when/how it was discovered).
 */
export interface DiscoverySpot extends Spot {
  discoveredAt?: Date
  discoveryId: string
}

// ──────────────────────────────────────────────────────────────
// Application Contract (unchanged)
// ──────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────
// Application Contract (unchanged)
// ──────────────────────────────────────────────────────────────

export interface DiscoveryApplicationContract {
  processLocation: (context: AccountContext, locationWithDirection: LocationWithDirection, trailId: string) => Promise<Result<DiscoveryLocationRecord>>
  createWelcomeDiscovery: (context: AccountContext, location: GeoLocation) => Promise<Result<WelcomeDiscoveryResult>>
  getDiscoveries: (context: AccountContext, trailId?: string, options?: QueryOptions) => Promise<Result<Discovery[]>>
  getDiscovery: (context: AccountContext, discoveryId: string) => Promise<Result<Discovery | undefined>>
  getDiscoveredSpotIds: (context: AccountContext, trailId?: string) => Promise<Result<string[]>>
  getDiscoveredSpots: (context: AccountContext, trailId?: string, options?: QueryOptions) => Promise<Result<DiscoverySpot[]>>
  getDiscoveredPreviewClues: (context: AccountContext, trailId: string) => Promise<Result<Clue[]>>
  getDiscoveryTrail: (context: AccountContext, trailId: string, userLocation?: GeoLocation) => Promise<Result<DiscoveryTrail>>
  getDiscoveryStats: (context: AccountContext, discoveryId: string) => Promise<Result<DiscoveryStats>>
  getDiscoveryTrailStats: (context: AccountContext, trailId: string) => Promise<Result<TrailStats>>
  getDiscoveryProfile: (context: AccountContext) => Promise<Result<DiscoveryProfile>>
  updateDiscoveryProfile: (context: AccountContext, updateData: DiscoveryProfileUpdateData) => Promise<Result<DiscoveryProfile>>
  getDiscoveryContent: (context: AccountContext, discoveryId: string) => Promise<Result<DiscoveryContent | undefined>>
  upsertDiscoveryContent: (context: AccountContext, discoveryId: string, content: { imageUrl?: string; comment?: string; visibility?: DiscoveryContentVisibility }) => Promise<Result<DiscoveryContent>>
  deleteDiscoveryContent: (context: AccountContext, discoveryId: string) => Promise<Result<void>>
  // Rating methods (delegated to SpotApplication with access control)
  rateSpot: (context: AccountContext, spotId: string, rating: number) => Promise<Result<SpotRating>>
  removeSpotRating: (context: AccountContext, spotId: string) => Promise<Result<void>>
  getSpotRatingSummary: (context: AccountContext, spotId: string) => Promise<Result<RatingSummary>>
}

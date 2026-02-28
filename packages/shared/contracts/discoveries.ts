import type { GeoLocation } from '@shared/geo/index.ts'
import { GeoLocationSchema } from '@shared/geo/types.ts'
import { z } from 'zod'
import { AccountContext } from './accounts.ts'
import { DiscoveryProfile, DiscoveryProfileUpdateData } from './discoveryProfile.ts'
import { ImageReferenceSchema } from './images.ts'
import { QueryOptions, Result } from './results.ts'
import { RatingSummary, SpotRating, SpotSchema } from "./spots.ts"
import { guard } from './strings.ts'
import { TrailStats } from './trails.ts'

// ──────────────────────────────────────────────────────────────
// Zod Schemas (Source of Truth)
// ──────────────────────────────────────────────────────────────

/**
 * Location with direction schema
 */
export const LocationWithDirectionSchema = z.object({
  location: GeoLocationSchema,
  direction: z.number().min(0).max(360).optional(),
})

/**
 * Discovery snap schema
 */
export const DiscoverySnapSchema = z.object({
  distance: guard.nonNegativeInt,
  intensity: z.number().min(0).max(100),
})

/**
 * Discovery schema
 */
export const DiscoverySchema = z.object({
  id: guard.idString,
  accountId: guard.idString,
  spotId: guard.idString,
  trailId: guard.idString,
  discoveredAt: z.date(),
  scanEventId: guard.idString.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

/**
 * Discovery spot (Spot with discovery metadata)
 */
export const DiscoverySpotSchema = SpotSchema.extend({
  discoveryId: z.string(),
  discoveredAt: z.date().optional(),
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
  spot: SpotSchema,
})

/**
 * Discovery stats schema
 */
export const DiscoveryStatsSchema = z.object({
  discoveryId: guard.idString,
  rank: guard.positiveInt,
  totalDiscoverers: guard.positiveInt,
  trailPosition: guard.nonNegativeInt,
  trailTotal: guard.positiveInt,
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
  id: guard.idString,
  spotId: guard.idString,
  trailId: guard.idString.optional(),
  location: GeoLocationSchema,
  source: ClueSourceSchema,
  discoveryRadius: guard.positiveInt,
  image: z.object({
    micro: ImageReferenceSchema.optional(),
    blurred: ImageReferenceSchema.optional(),
  }).optional(),
})

/**
 * Discovery trail schema
 * Note: trail field is omitted due to circular dependency with trails.ts.
 * Validation is done at the application layer.
 */
export const DiscoveryTrailSchema = z.object({
  createdAt: z.date().optional(),
  clues: z.array(ClueSchema),
  previewClues: z.array(ClueSchema).optional(),
  spots: z.array(DiscoverySpotSchema),
  discoveries: z.array(DiscoverySchema),
  trail: z.unknown().optional(), // Trail field: validated at app layer (can't import due to circular dependency)
})

/**
 * Discovery content visibility enum
 */
export const DiscoveryContentVisibilitySchema = z.enum(['private', 'public'])

/**
 * Discovery content schema
 */
export const DiscoveryContentSchema = z.object({
  id: guard.idString,
  discoveryId: guard.idString,
  accountId: guard.idString,
  image: ImageReferenceSchema.optional(),
  comment: z.string().max(10000).optional(),
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
export type DiscoverySpot = z.infer<typeof DiscoverySpotSchema>
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
  imageUrl: z.string().url().optional(),
  comment: z.string().max(10000).optional(),
  visibility: DiscoveryContentVisibilitySchema.optional(),
})

export type UpsertDiscoveryContentRequest = z.infer<typeof UpsertDiscoveryContentRequestSchema>

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

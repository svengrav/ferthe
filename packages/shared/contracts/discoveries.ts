import { GeoLocation } from '@shared/geo/index.ts'
import { AccountContext } from './accounts.ts'
import { DiscoveryProfile, DiscoveryProfileUpdateData } from './discoveryProfile.ts'
import { ImageReference } from './images.ts'
import { QueryOptions, Result } from './results.ts'
import { RatingSummary, Spot, SpotRating } from "./spots.ts"
import { Trail, TrailStats } from './trails.ts'

/**
 * Result of creating a welcome discovery after onboarding.
 * Contains the auto-generated spot and the persisted discovery record.
 */
export interface WelcomeDiscoveryResult {
  discovery: Discovery
  spot: Spot
}

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
  upsertDiscoveryContent: (context: AccountContext, discoveryId: string, content: { imageUrl?: string; comment?: string }) => Promise<Result<DiscoveryContent>>
  deleteDiscoveryContent: (context: AccountContext, discoveryId: string) => Promise<Result<void>>
  // Rating methods (delegated to SpotApplication with access control)
  rateSpot: (context: AccountContext, spotId: string, rating: number) => Promise<Result<SpotRating>>
  removeSpotRating: (context: AccountContext, spotId: string) => Promise<Result<void>>
  getSpotRatingSummary: (context: AccountContext, spotId: string) => Promise<Result<RatingSummary>>
}

export interface LocationWithDirection {
  location: GeoLocation
  direction: number // Compass direction in degrees (0-360, where 0 = North)
}

export interface DiscoverySnap {
  distance: number // Distance in meters
  intensity: number // 0-1, where 1 = at target, 0 = at max distance or beyond
}

export interface DiscoveryLocationRecord {
  createdAt: Date
  locationWithDirection: LocationWithDirection
  snap?: DiscoverySnap | undefined
  discoveries: Discovery[]
}

export interface Discovery {
  id: string
  accountId: string
  spotId: string
  trailId: string
  discoveredAt: Date
  scanEventId?: string
  createdAt: Date
  updatedAt: Date
}

export interface DiscoveryStats {
  discoveryId: string
  rank: number // Which user number discovered this spot
  totalDiscoverers: number // Total number of discoverers for this spot
  trailPosition: number // Position in trail (e.g., 5 in 5/10)
  trailTotal: number // Total number of spots in trail (e.g., 10 in 5/10)
  timeSinceLastDiscovery?: number // Seconds since last own discovery
  distanceFromLastDiscovery?: number // Meters to last own discovery
}

export interface DiscoveryTrail {
  createdAt?: Date
  trail: Trail | undefined
  clues: Clue[]
  previewClues?: Clue[]
  spots: DiscoverySpot[]
  discoveries: Discovery[]
}


/**
 * Combines a Spot with its Discovery metadata.
 * Extends Spot with discovery context (when/how it was discovered).
 */
export interface DiscoverySpot extends Spot {
  discoveredAt: Date
  discoveryId: string
}

export type ClueSource = 'preview' | 'scanEvent'

export interface Clue {
  id: string
  spotId: string
  trailId?: string
  location: GeoLocation
  source: ClueSource
  discoveryRadius: number
}

/**
 * User-generated content for a discovery (image + comment).
 * Each discovery can have at most one content entry.
 */
export interface DiscoveryContent {
  id: string
  discoveryId: string
  accountId: string
  image?: ImageReference
  comment?: string
  createdAt: Date
  updatedAt: Date
}

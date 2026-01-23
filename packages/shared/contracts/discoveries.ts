import { GeoLocation } from '@shared/geo/index.ts'
import { AccountContext } from './accounts.ts'
import { DiscoveryProfile, DiscoveryProfileUpdateData } from './discoveryProfile.ts'
import { Result } from './results.ts'
import { Spot } from './spots.ts'
import { Trail } from './trails.ts'

export interface DiscoveryApplicationContract {
  processLocation: (context: AccountContext, locationWithDirection: LocationWithDirection, trailId: string, communityId?: string) => Promise<Result<DiscoveryLocationRecord>>
  getDiscoveries: (context: AccountContext, trailId?: string, communityId?: string) => Promise<Result<Discovery[]>>
  getDiscovery: (context: AccountContext, discoveryId: string) => Promise<Result<Discovery | undefined>>
  getDiscoveredSpotIds: (context: AccountContext, trailId?: string) => Promise<Result<string[]>>
  getDiscoveredSpots: (context: AccountContext, trailId?: string) => Promise<Result<Spot[]>>
  getDiscoveredPreviewClues: (context: AccountContext, trailId: string) => Promise<Result<Clue[]>>
  getDiscoveryTrail: (context: AccountContext, trailId: string, userLocation?: GeoLocation, communityId?: string) => Promise<Result<DiscoveryTrail>>
  getDiscoveryStats: (context: AccountContext, discoveryId: string) => Promise<Result<DiscoveryStats>>
  getDiscoveryProfile: (context: AccountContext) => Promise<Result<DiscoveryProfile>>
  updateDiscoveryProfile: (context: AccountContext, updateData: DiscoveryProfileUpdateData) => Promise<Result<DiscoveryProfile>>
  addDiscoveryContent: (context: AccountContext, discoveryId: string, content: { imageUrl?: string; comment?: string }) => Promise<Result<DiscoveryContent>>
  getDiscoveryContent: (context: AccountContext, discoveryId: string) => Promise<Result<DiscoveryContent | undefined>>
  updateDiscoveryContent: (context: AccountContext, discoveryId: string, content: { imageUrl?: string; comment?: string }) => Promise<Result<DiscoveryContent>>
  deleteDiscoveryContent: (context: AccountContext, discoveryId: string) => Promise<Result<void>>
  reactToDiscovery: (context: AccountContext, discoveryId: string, reaction: 'like' | 'dislike') => Promise<Result<DiscoveryReaction>>
  removeReaction: (context: AccountContext, discoveryId: string) => Promise<Result<void>>
  getReactionSummary: (context: AccountContext, discoveryId: string) => Promise<Result<ReactionSummary>>
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
  communityId?: string // Optional: if discovery is shared within a community
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
  spots: Spot[]
  discoveries: Discovery[]
}

export type ClueSource = 'preview' | 'scanEvent'

export interface Clue {
  id: string
  spotId: string
  trailId: string
  location: GeoLocation
  source: ClueSource
}

/**
 * User-generated content for a discovery (image + comment).
 * Each discovery can have at most one content entry.
 */
export interface DiscoveryContent {
  id: string
  discoveryId: string
  accountId: string
  imageUrl?: string
  comment?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * User reaction (like/dislike) for a discovery.
 */
export interface DiscoveryReaction {
  id: string
  discoveryId: string
  accountId: string
  reaction: 'like' | 'dislike'
  createdAt: Date
}

/**
 * Aggregated reaction counts for a discovery.
 */
export interface ReactionSummary {
  likes: number
  dislikes: number
  userReaction?: 'like' | 'dislike' // Current user's reaction, if any
}

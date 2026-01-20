import { GeoLocation } from '@shared/geo/index.ts'
import { AccountContext } from './accounts.ts'
import { DiscoveryProfile, DiscoveryProfileUpdateData } from './discoveryProfile.ts'
import { Result } from './results.ts'
import { Spot } from './spots.ts'
import { Trail } from './trails.ts'

export interface DiscoveryApplicationContract {
  processLocation: (context: AccountContext, locationWithDirection: LocationWithDirection, trailId: string) => Promise<Result<DiscoveryLocationRecord>>
  getDiscoveries: (context: AccountContext, trailId?: string) => Promise<Result<Discovery[]>>
  getDiscovery: (context: AccountContext, discoveryId: string) => Promise<Result<Discovery | undefined>>
  getDiscoveredSpotIds: (context: AccountContext, trailId?: string) => Promise<Result<string[]>>
  getDiscoveredSpots: (context: AccountContext, trailId?: string) => Promise<Result<Spot[]>>
  getDiscoveredPreviewClues: (context: AccountContext, trailId: string) => Promise<Result<Clue[]>>
  getDiscoveryTrail: (context: AccountContext, trailId: string, userLocation?: GeoLocation) => Promise<Result<DiscoveryTrail>>
  getDiscoveryStats: (context: AccountContext, discoveryId: string) => Promise<Result<DiscoveryStats>>

  // Profile methods
  getDiscoveryProfile: (context: AccountContext) => Promise<Result<DiscoveryProfile>>
  updateDiscoveryProfile: (context: AccountContext, updateData: DiscoveryProfileUpdateData) => Promise<Result<DiscoveryProfile>>
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

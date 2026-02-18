import { Discovery, Spot, SpotUserStatus } from '@shared/contracts'

export interface SpotServiceActions {
  enrichSpotWithUserStatus: (spot: Spot, userId: string, discoveries: Discovery[]) => Spot
  enrichSpotsWithUserStatus: (spots: Spot[], userId: string, discoveries: Discovery[]) => Spot[]
  filterSpotByUserStatus: (spot: Spot) => Spot | undefined
}

/**
 * Determines the user-specific status of a spot.
 * 
 * @param spot The spot to enrich
 * @param userId The current user's account ID
 * @param discoveries All discoveries (will be filtered for user)
 * @returns User-specific status
 */
const determineUserStatus = (spot: Spot, userId: string, discoveries: Discovery[]): SpotUserStatus => {
  // Check if user created this spot
  if (spot.createdBy === userId) {
    return 'creator'
  }

  // Check if user discovered this spot
  const hasDiscovered = discoveries.some(
    d => d.accountId === userId && d.spotId === spot.id
  )
  if (hasDiscovered) {
    return 'discovered'
  }

  // Check if spot is in preview mode (visible but not discovered)
  if (spot.options.visibility === 'preview') {
    return 'preview'
  }

  return 'unknown'
}

/**
 * Enriches a single spot with user-specific status.
 */
const enrichSpotWithUserStatus = (spot: Spot, userId: string, discoveries: Discovery[]): Spot => {
  const userStatus = determineUserStatus(spot, userId, discoveries)
  return {
    ...spot,
    userStatus,
  }
}

/**
 * Enriches multiple spots with user-specific status.
 * Optimized for batch processing.
 */
const enrichSpotsWithUserStatus = (spots: Spot[], userId: string, discoveries: Discovery[]): Spot[] => {
  // Pre-filter discoveries for this user for better performance
  const userDiscoveries = discoveries.filter(d => d.accountId === userId)

  return spots.map(spot => enrichSpotWithUserStatus(spot, userId, userDiscoveries))
}

/**
 * Filters spot data based on user status.
 * Returns appropriate data level for each status:
 * - 'discovered'/'creator': Full spot data
 * - 'preview': Limited data (blurred image, no exact location, no description)
 * - 'unknown': Undefined (spot should not be visible)
 * 
 * @param spot Spot with userStatus already enriched
 * @returns Filtered spot or undefined
 */
const filterSpotByUserStatus = (spot: Spot): Spot | undefined => {
  const { userStatus } = spot

  // Full access for discovered spots and creators
  if (userStatus === 'discovered' || userStatus === 'creator') {
    return spot
  }

  // Preview mode: Limited information
  if (userStatus === 'preview') {
    return {
      ...spot,
      // Remove sensitive data
      description: '', // Hide description
      image: undefined, // Hide clear image
      location: {
        // Obfuscate exact location (could be randomized in future)
        lat: Math.round(spot.location.lat * 100) / 100, // Round to ~1km precision
        lng: Math.round(spot.location.lng * 100) / 100,
      },
    }
  }

  // Unknown status: No access
  return undefined
}

export function createSpotService(): SpotServiceActions {
  return {
    enrichSpotWithUserStatus,
    enrichSpotsWithUserStatus,
    filterSpotByUserStatus,
  }
}

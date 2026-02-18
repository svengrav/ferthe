import { Discovery, Spot, SpotSource } from '@shared/contracts'

export interface SpotServiceActions {
  enrichSpotWithSource: (spot: Spot, userId: string, discoveries: Discovery[]) => Spot
  enrichSpotsWithSource: (spots: Spot[], userId: string, discoveries: Discovery[]) => Spot[]
  filterSpotBySource: (spot: Spot) => Spot | undefined
}

/**
 * Determines the source/origin of a spot.
 * 
 * @param spot The spot to enrich
 * @param userId The current user's account ID
 * @param discoveries All discoveries (will be filtered for user)
 * @returns Spot source
 */
const determineSpotSource = (spot: Spot, userId: string, discoveries: Discovery[]): SpotSource => {
  // Check if user created this spot
  if (spot.createdBy === userId) {
    return 'created'
  }

  // Check if user discovered this spot
  const hasDiscovered = discoveries.some(
    d => d.accountId === userId && d.spotId === spot.id
  )
  if (hasDiscovered) {
    return 'discovery'
  }

  // Spot is in preview mode
  return 'preview'
}

/**
 * Enriches a single spot with source information.
 */
const enrichSpotWithSource = (spot: Spot, userId: string, discoveries: Discovery[]): Spot => {
  const source = determineSpotSource(spot, userId, discoveries)
  return {
    ...spot,
    source,
  }
}

/**
 * Enriches multiple spots with source information.
 * Optimized for batch processing.
 */
const enrichSpotsWithSource = (spots: Spot[], userId: string, discoveries: Discovery[]): Spot[] => {
  // Pre-filter discoveries for this user for better performance
  const userDiscoveries = discoveries.filter(d => d.accountId === userId)

  return spots.map(spot => enrichSpotWithSource(spot, userId, userDiscoveries))
}

/**
 * Filters spot data based on source.
 * Returns appropriate data level for each source:
 * - 'discovery'/'created': Full spot data
 * - 'preview': Limited data (blurred image, no exact location, no description)
 * 
 * @param spot Spot with source already enriched
 * @returns Filtered spot or undefined
 */
const filterSpotBySource = (spot: Spot): Spot | undefined => {
  const { source } = spot

  // Full access for discovered spots and creators
  if (source === 'discovery' || source === 'created') {
    return spot
  }

  // Preview mode: Limited information
  if (source === 'preview') {
    return {
      ...spot,
      // Remove sensitive data
      description: '', // Hide description
      image: undefined, // Hide clear image
      location: {
        // Obfuscate exact location (could be randomized in future)
        lat: Math.round(spot.location.lat * 100) / 100, // Round to ~1km precision
        lon: Math.round(spot.location.lon * 100) / 100,
      },
    }
  }

  // No source set: Should not be visible
  return undefined
}

export function createSpotService(): SpotServiceActions {
  return {
    enrichSpotWithSource,
    enrichSpotsWithSource,
    filterSpotBySource,
  }
}

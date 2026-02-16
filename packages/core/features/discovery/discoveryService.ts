import { createDeterministicId } from '@core/utils/idGenerator'
import { Clue, ClueSource, Discovery, DiscoveryContent, DiscoveryLocationRecord, DiscoveryReaction, DiscoverySnap, DiscoverySpot, DiscoveryStats, DiscoveryTrail, LocationWithDirection, ReactionSummary, ScanEvent, Spot, Trail } from '@shared/contracts'
import { GeoLocation, geoUtils } from '@shared/geo'

export interface Target {
  spotId: string
  distanceToUser?: number
  isInRange?: boolean
}

// Add this interface for user position
/**
 * Type definition for the Discovery Service functionality
 */
export type DiscoveryServiceActions = {
  getTargets: (accountId: string, trail: Trail, discoveries: Discovery[], spots: Spot[]) => Spot[]
  createDiscovery: (accountId: string, spotId: string, trailId: string, scanEventId?: string) => Discovery
  processScanEvent: (scanEvent: ScanEvent, trail: Trail, discoveries: Discovery[], trailSpotIds: string[]) => Discovery[] | null
  isTrailCompleted: (accountId: string, trailId: string, discoveries: Discovery[], trailSpotIds: string[]) => boolean
  getTrailCompletionPercentage: (accountId: string, trailId: string, discoveries: Discovery[], trailSpotIds: string[]) => number
  getDiscoveredSpotIds: (accountId: string, discoveries: Discovery[], trailId?: string) => string[]
  getDiscoveredSpots: (accountId: string, discoveries: Discovery[], spots: Spot[], trailId?: string) => DiscoverySpot[]
  getDiscoveries: (accountId: string, discoveries: Discovery[], trailId?: string) => Discovery[]
  getDiscoverySpot: (id: string, spots: Spot[]) => Spot | undefined
  getCluesBasedOnPreviewMode: (accountId: string, trail: Trail, discoveries: Discovery[], spots: Spot[], trailSpotIds: string[]) => Clue[]
  createClue: (spot: Spot, trailId: string, source: ClueSource) => Clue
  getNewDiscoveries(accountId: string, position: GeoLocation, spots: Spot[], discoveries: Discovery[], trail: Trail): Discovery[]
  getDiscoverySnap: (currentLocation: GeoLocation, spots: Spot[], exploredSpotIds: string[], maxRangeInMeters?: number) => DiscoverySnap | undefined
  processLocationUpdate: (accountId: string, locationWithDirection: LocationWithDirection, discoveries: Discovery[], spots: Spot[], trail: Trail) => DiscoveryLocationRecord
  createDiscoveryTrail: (accountId: string, trail: Trail, discoveries: Discovery[], spots: Spot[], trailSpotIds: string[], userLocation?: GeoLocation) => DiscoveryTrail
  getDiscoveryStats: (discovery: Discovery, allDiscoveriesForSpot: Discovery[], userDiscoveries: Discovery[], trailSpotIds: string[], spots: Spot[]) => DiscoveryStats
  createDiscoveryContent: (accountId: string, discoveryId: string, content: { imageUrl?: string; comment?: string }) => DiscoveryContent
  updateDiscoveryContent: (existing: DiscoveryContent, content: { imageUrl?: string; comment?: string }) => DiscoveryContent
  createReaction: (accountId: string, discoveryId: string, rating: number) => DiscoveryReaction
  getReactionSummary: (discoveryId: string, reactions: DiscoveryReaction[], accountId: string) => ReactionSummary
}

/**
 * Calculates distance between two coordinates in meters using Haversine formula
 */
const calculateDistance = (start: { lat: number; lon: number }, end: { lat: number; lon: number }): number => {
  const { lat: lat1, lon: lon1 } = start
  const { lat: lat2, lon: lon2 } = end
  const R = 6371e3 // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

const getDiscoveries = (accountId: string, discoveries: Discovery[], trailId?: string) => {
  return discoveries.filter(discovery => {
    const matchesAccount = discovery.accountId === accountId
    const matchesTrail = !trailId || discovery.trailId === trailId
    return matchesAccount && matchesTrail
  })
}

const getDiscoveredSpots = (accountId: string, discoveries: Discovery[], spots: Spot[], trailId?: string): DiscoverySpot[] => {
  const relevantDiscoveries = discoveries.filter(discovery => {
    const matchesAccount = discovery.accountId === accountId
    const matchesTrail = !trailId || discovery.trailId === trailId
    return matchesAccount && matchesTrail
  })

  // Sort by discoveredAt (oldest first)
  const sortedDiscoveries = relevantDiscoveries.sort((a, b) =>
    new Date(a.discoveredAt).getTime() - new Date(b.discoveredAt).getTime()
  )

  return sortedDiscoveries.map(discovery => {
    const spot = spots.find(s => s.id === discovery.spotId)
    if (!spot) {
      throw new Error(`Spot not found for discovery ${discovery.id}`)
    }
    return {
      ...spot,
      discoveredAt: discovery.discoveredAt,
      discoveryId: discovery.id,
    }
  })
}
/**
 * Determines valid targets for a user on a trail based on discovery mode
 *
 * @param accountId The ID of the user
 * @param trail The trail containing spots
 * @param discoveries Previous discoveries made by the user
 * @param spots All spots on the trail
 * @returns Array of valid targets
 */
const getTargets = (accountId: string, trail: Trail, discoveries: Discovery[], spots: Spot[]): Spot[] => {
  // Implementation for determining valid targets
  const discoveredSpotIds = discoveries.filter(d => d.accountId === accountId && d.trailId === trail.id).map(d => d.spotId)

  if (trail.options?.discoveryMode === 'free') {
    return spots
  }

  if (trail.options?.discoveryMode === 'sequence') {
    return spots.filter(spot => !discoveredSpotIds.includes(spot.id))
  }

  return []
}

/**
 * Creates a new discovery record when a user discovers a spot
 */
const createDiscovery = (accountId: string, spotId: string, trailId: string, scanEventId?: string): Discovery => {
  const id = createDiscoveryId(accountId, spotId, trailId)

  return {
    id,
    accountId,
    spotId,
    trailId,
    discoveredAt: new Date(),
    scanEventId: scanEventId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

const getNewDiscoveries = (accountId: string, position: GeoLocation, spots: Spot[], discoveries: Discovery[], trail: Trail): Discovery[] => {
  const undiscoveredSpots = spots.filter(spot => !discoveries.some(discovery => discovery.accountId === accountId && discovery.spotId === spot.id))
  const newDiscoveries: Discovery[] = []
  for (const spot of undiscoveredSpots) {
    const distanceToSpot = geoUtils.calculateDistance(position, spot.location)
    if (distanceToSpot <= spot.options.discoveryRadius) {
      newDiscoveries.push(createDiscovery(accountId, spot.id, trail.id))
    }
  }

  return newDiscoveries
}

/**
 * Determines if a scan event results in a discovery
 */
const processScanEvent = (scanEvent: ScanEvent, trail: Trail, discoveries: Discovery[], trailSpotIds: string[]): Discovery[] | null => {
  // Only successful scans can result in discoveries
  if (!scanEvent.successful || scanEvent.clues.length === 0) {
    return null
  }

  const userDiscoveries = discoveries.filter(d => d.accountId === scanEvent.accountId && d.trailId === trail.id)
  const discoveredSpotIds = userDiscoveries.map(d => d.spotId)

  // Extract spotIds from clues
  const scannedSpotIds = scanEvent.clues.map(clue => clue.spotId)
  let spotsToDiscover: string[] = []

  if (trail.options?.discoveryMode === 'free') {
    // In free mode, discover all spots that haven't been discovered yet
    spotsToDiscover = scannedSpotIds.filter(spotId => !discoveredSpotIds.includes(spotId))
  } else if (trail.options?.discoveryMode === 'sequence') {
    // In sequence mode, discover the next spot in sequence if it's in the scanned spots
    const nextSpotIndex = discoveredSpotIds.length

    if (nextSpotIndex < trailSpotIds.length) {
      const nextSpotId = trailSpotIds[nextSpotIndex]
      if (scannedSpotIds.includes(nextSpotId)) {
        spotsToDiscover = [nextSpotId]
      }
    }
  }

  // If no valid spots to discover, return null
  if (spotsToDiscover.length === 0) {
    return null
  }

  // Create new discoveries for all valid spots
  return spotsToDiscover.map(spotId => createDiscovery(scanEvent.accountId, spotId, trail.id, scanEvent.id))
}

/**
 * Checks if a user has completed a trail
 */
const isTrailCompleted = (accountId: string, trailId: string, discoveries: Discovery[], trailSpotIds: string[]): boolean => {
  const discoveredSpotIds = discoveries.filter(d => d.accountId === accountId && d.trailId === trailId).map(d => d.spotId)

  // A trail is completed when all spots have been discovered
  return trailSpotIds.every(spotId => discoveredSpotIds.includes(spotId))
}

/**
 * Gets the completion percentage for a trail
 */
const getTrailCompletionPercentage = (accountId: string, trailId: string, discoveries: Discovery[], trailSpotIds: string[]): number => {
  const discoveredSpotIds = discoveries.filter(d => d.accountId === accountId && d.trailId === trailId).map(d => d.spotId)

  if (trailSpotIds.length === 0) {
    return 0
  }

  const discoveredCount = trailSpotIds.filter(spotId => discoveredSpotIds.includes(spotId)).length

  return Math.round((discoveredCount / trailSpotIds.length) * 100)
}

/**
 * Creates a deterministic ID for Discovery objects based on account, spot, and optional trail.
 * This ensures that the same combination of account/spot/trail always generates the same ID,
 * preventing duplicate discoveries from being created in race conditions.
 *
 * @param accountId The account/user ID
 * @param spotId The spot ID
 * @param trailId Optional trail ID
 * @returns A deterministic ID for the discovery
 */
function createDiscoveryId(accountId: string, spotId: string, trailId?: string): string {
  const args = [accountId, spotId]
  if (trailId) {
    args.push(trailId)
  }
  return createDeterministicId(...args)
}

/**
 * Gets all discovered spots for a trail
 */
const getDiscoveredSpotIds = (accountId: string, discoveries: Discovery[], trailId?: string): string[] => {
  return discoveries
    .filter(discovery => discovery.accountId === accountId)
    .filter(discovery => !trailId || discovery.trailId === trailId)
    .map(discovery => discovery.spotId)
}

const getDiscoverySpot = (id: string, spots: Spot[]): Spot | undefined => {
  return spots.find(s => s.id === id)
}

const createClue = (spot: Spot, trailId: string, source: ClueSource): Clue => {
  const now = new Date()
  return {
    id: `${spot.id}-${now.getTime()}`,
    spotId: spot.id,
    trailId: trailId,
    location: spot.location,
    source: source,
    discoveryRadius: spot.options.discoveryRadius,
  }
}

/**
 * Returns spots as clues based on the trail's previewMode setting and spot visibility
 */
const getCluesBasedOnPreviewMode = (accountId: string, trail: Trail, discoveries: Discovery[], spots: Spot[], trailSpotIds: string[]): Clue[] => {
  if (trail.options?.previewMode !== 'preview') return []
  const discoveredSpotIds = getDiscoveredSpotIds(accountId, discoveries, trail.id)
  const previewSpotIds = trailSpotIds.filter(spotId => !discoveredSpotIds.includes(spotId))
  return previewSpotIds
    .map(spotId => getDiscoverySpot(spotId, spots))
    .filter(spot => spot && spot.options.visibility === 'preview')
    .map(spot => createClue(spot as Spot, trail.id, 'preview'))
}

const getDiscoverySnap = (currentLocation: GeoLocation, spots: Spot[], exploredSpotIds: string[], maxRangeInMeters?: number): DiscoverySnap | undefined => {
  const unexploredSpots = spots.filter(spot => !exploredSpotIds.includes(spot.id))
  if (unexploredSpots.length === 0) {
    return undefined
  }

  // Filter spots by max range if specified
  const spotsInRange = maxRangeInMeters ? unexploredSpots.filter(spot => calculateDistance(currentLocation, spot.location) <= maxRangeInMeters) : unexploredSpots

  if (spotsInRange.length === 0) {
    return {
      intensity: 0,
      distance: 0,
    }
  }

  const nearestSpot = spotsInRange.reduce((closest, spot) => {
    const distanceToCurrent = calculateDistance(currentLocation, closest.location)
    const distanceToSpot = calculateDistance(currentLocation, spot.location)
    return distanceToSpot < distanceToCurrent ? spot : closest
  })

  const distance = calculateDistance(currentLocation, nearestSpot.location)

  return {
    intensity: calculateProximityIntensity(distance, maxRangeInMeters || 1000), // Default max range if not specified
    distance: Math.round(distance),
  }
}

/**
 * Calculate proximity intensity based on distance to target
 * @param currentDistance Current distance to target in meters
 * @param maxDistance Maximum distance where intensity becomes 0
 * @returns Intensity value from 0 to 1
 */
const calculateProximityIntensity = (currentDistance: number, maxDistance: number): number => {
  if (currentDistance >= maxDistance) return 0
  if (currentDistance <= 0) return 1

  // Linear interpolation from 1 (at distance 0) to 0 (at maxDistance)
  return Math.max(0, Math.min(1, 1 - currentDistance / maxDistance))
}

const processLocationUpdate = (
  accountId: string,
  { location, direction }: LocationWithDirection,
  discoveries: Discovery[],
  spots: Spot[],
  trail: Trail
): DiscoveryLocationRecord => {
  // Orchestration: Process new discoveries
  const newDiscoveries = getNewDiscoveries(accountId, location, spots, discoveries, trail)

  // Include new discoveries in explored spot IDs
  const exploredSpotIds = [...discoveries.filter(d => d.accountId === accountId).map(d => d.spotId), ...newDiscoveries.map(d => d.spotId)]

  const snap = getDiscoverySnap(location, spots, exploredSpotIds, trail.options?.snapRadius || trail.options.scannerRadius)

  return {
    locationWithDirection: { location, direction },
    createdAt: new Date(),
    discoveries: newDiscoveries,
    snap: snap,
  }
}

/**
 * Creates a DiscoveryTrail object with all necessary data, filtering preview clues by map boundaries
 */
const createDiscoveryTrail = (accountId: string, trail: Trail, discoveries: Discovery[], spots: Spot[], trailSpotIds: string[], userLocation?: GeoLocation): DiscoveryTrail => {
  const trailDiscoveries = getDiscoveries(accountId, discoveries, trail.id)
  const discoveredSpots = getDiscoveredSpots(accountId, discoveries, spots, trail.id)

  // Get all preview clues first
  const allClues = getCluesBasedOnPreviewMode(accountId, trail, discoveries, spots, trailSpotIds)

  // Filter clues by map boundaries if user location is provided
  let filteredClues = allClues
  if (userLocation) {
    const mapBoundary = trail.boundary
    filteredClues = allClues.filter(clue => geoUtils.isCoordinateInBounds(clue.location, mapBoundary))
  }

  return {
    trail,
    spots: discoveredSpots,
    clues: [],
    previewClues: filteredClues,
    discoveries: trailDiscoveries,
    createdAt: new Date(),
  }
}

/**
 * Calculates comprehensive statistics for a discovery
 * @param discovery The discovery to calculate stats for
 * @param allDiscoveriesForSpot All discoveries for this specific spot (all users)
 * @param userDiscoveries All discoveries by this user (sorted by discoveredAt)
 * @param trailSpotIds Ordered list of spot IDs in the trail
 * @param spots All spots in the system
 * @returns Complete discovery statistics
 */
const getDiscoveryStats = (
  discovery: Discovery,
  allDiscoveriesForSpot: Discovery[],
  userDiscoveries: Discovery[],
  trailSpotIds: string[],
  spots: Spot[]
): DiscoveryStats => {
  // Sort all discoveries for this spot by date to determine rank
  const sortedSpotDiscoveries = [...allDiscoveriesForSpot].sort((a, b) => new Date(a.discoveredAt).getTime() - new Date(b.discoveredAt).getTime())
  const rank = sortedSpotDiscoveries.findIndex(d => d.id === discovery.id) + 1

  // Calculate trail position based on trailSpotIds order
  const userDiscoveredSpotIds = userDiscoveries.filter(d => d.trailId === discovery.trailId).map(d => d.spotId)
  const trailPosition = userDiscoveredSpotIds.filter(spotId => trailSpotIds.includes(spotId)).length

  // Find previous discovery for time and distance calculation
  const sortedUserDiscoveries = [...userDiscoveries].sort((a, b) => new Date(a.discoveredAt).getTime() - new Date(b.discoveredAt).getTime())
  const currentIndex = sortedUserDiscoveries.findIndex(d => d.id === discovery.id)
  const previousDiscovery = currentIndex > 0 ? sortedUserDiscoveries[currentIndex - 1] : undefined

  let timeSinceLastDiscovery: number | undefined
  let distanceFromLastDiscovery: number | undefined

  if (previousDiscovery) {
    // Calculate time difference in seconds
    const currentTime = new Date(discovery.discoveredAt).getTime()
    const previousTime = new Date(previousDiscovery.discoveredAt).getTime()
    timeSinceLastDiscovery = Math.floor((currentTime - previousTime) / 1000)

    // Calculate distance if both spots exist
    const currentSpot = spots.find(s => s.id === discovery.spotId)
    const previousSpot = spots.find(s => s.id === previousDiscovery.spotId)

    if (currentSpot && previousSpot) {
      distanceFromLastDiscovery = Math.round(calculateDistance(previousSpot.location, currentSpot.location))
    }
  }

  return {
    discoveryId: discovery.id,
    rank,
    totalDiscoverers: allDiscoveriesForSpot.length,
    trailPosition,
    trailTotal: trailSpotIds.length,
    timeSinceLastDiscovery,
    distanceFromLastDiscovery,
  }
}

/**
 * Creates a new discovery content entry (image + comment)
 */
const createDiscoveryContent = (accountId: string, discoveryId: string, content: { imageUrl?: string; comment?: string }): DiscoveryContent => {
  const now = new Date()

  // Convert imageUrl to ImageReference if provided
  const image = content.imageUrl ? {
    id: '', // Will be set by upload result
    url: content.imageUrl,
  } : undefined

  return {
    id: createDeterministicId('discovery-content', discoveryId),
    discoveryId,
    accountId,
    image,
    comment: content.comment,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Updates an existing discovery content entry
 */
const updateDiscoveryContent = (existing: DiscoveryContent, content: { imageUrl?: string; comment?: string }): DiscoveryContent => {
  // Convert imageUrl to ImageReference if provided, otherwise keep existing
  const image = content.imageUrl ? {
    id: '', // Will be set by upload result
    url: content.imageUrl,
  } : existing.image

  return {
    ...existing,
    image,
    comment: content.comment ?? existing.comment,
    updatedAt: new Date(),
  }
}

/**
 * Creates a rating (1-5 stars) for a discovery
 */
const createReaction = (accountId: string, discoveryId: string, rating: number): DiscoveryReaction => {
  // Validate rating is between 1-5
  const validRating = Math.max(1, Math.min(5, Math.round(rating)))
  
  return {
    id: createDeterministicId('discovery-reaction', discoveryId, accountId),
    discoveryId,
    accountId,
    rating: validRating,
    createdAt: new Date(),
  }
}

/**
 * Aggregates ratings into a summary with average and current user's rating
 */
const getReactionSummary = (discoveryId: string, reactions: DiscoveryReaction[], accountId: string): ReactionSummary => {
  const discoveryReactions = reactions.filter(r => r.discoveryId === discoveryId)
  const userRating = discoveryReactions.find(r => r.accountId === accountId)?.rating
  
  const count = discoveryReactions.length
  const average = count > 0 
    ? discoveryReactions.reduce((sum, r) => sum + r.rating, 0) / count
    : 0

  return {
    average: Math.round(average * 10) / 10, // Round to 1 decimal
    count,
    userRating,
  }
}

export const createDiscoveryService = (): DiscoveryServiceActions => ({
  getDiscoveredSpots,
  getDiscoveries,
  getDiscoverySpot,
  getTargets,
  createDiscovery,
  processScanEvent,
  isTrailCompleted,
  getTrailCompletionPercentage,
  getDiscoveredSpotIds,
  getCluesBasedOnPreviewMode,
  createClue,
  getNewDiscoveries,
  getDiscoverySnap,
  processLocationUpdate,
  createDiscoveryTrail,
  getDiscoveryStats,
  createDiscoveryContent,
  updateDiscoveryContent,
  createReaction,
  getReactionSummary,
})

import { createDeterministicId } from '@core/utils/idGenerator'
import { Clue, ClueSource, Discovery, DiscoveryContent, DiscoveryLocationRecord, DiscoverySnap, DiscoverySpot, DiscoveryStats, DiscoveryTrail, ImageReference, LocationWithDirection, RatingSummary, ScanEvent, Spot, SpotRating, SpotSource, Trail, TrailStats } from '@shared/contracts'
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
  enrichSpotWithSource: (spot: Spot, userId: string, discoveries: Discovery[]) => Spot
  enrichSpotsWithSource: (spots: Spot[], userId: string, discoveries: Discovery[]) => Spot[]
  filterSpotBySource: (spot: Spot) => Spot | undefined
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
  getTrailStats: (accountId: string, trailId: string, allDiscoveries: Discovery[], trailSpotIds: string[]) => TrailStats
  createDiscoveryContent: (accountId: string, discoveryId: string, content: { imageUrl?: string; comment?: string }) => DiscoveryContent
  updateDiscoveryContent: (existing: DiscoveryContent, content: { imageUrl?: string; comment?: string }) => DiscoveryContent
  createSpotRating: (accountId: string, spotId: string, rating: number) => SpotRating
  getSpotRatingSummary: (spotId: string, ratings: SpotRating[], accountId: string) => RatingSummary
}

/**
 * Calculates distance between two coordinates in meters using Haversine formula
 */
/**
 * Determines the source/origin of a spot for the current user.
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

  // Spot is in preview mode (visible but not discovered)
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

  return sortedDiscoveries.reduce<DiscoverySpot[]>((acc, discovery) => {
    const spot = spots.find(s => s.id === discovery.spotId)
    if (!spot) return acc // skip orphaned discoveries
    acc.push({
      ...spot,
      discoveredAt: discovery.discoveredAt,
      discoveryId: discovery.id,
      source: spot.createdBy === accountId ? 'created' : 'discovery',
    })
    return acc
  }, [])
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
  const undiscoveredSpots = spots.filter(spot =>
    spot.createdBy !== accountId &&
    !discoveries.some(discovery => discovery.accountId === accountId && discovery.spotId === spot.id)
  )
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

  // Derive micro image from blurred image if available
  let clueImage: { micro?: ImageReference; blurred?: ImageReference } | undefined
  if (spot.blurredImage) {
    const microUrl = spot.blurredImage.url.replace('-blurred', '-micro')
    const microId = spot.blurredImage.id.replace('-blurred', '-micro')

    clueImage = {
      micro: { id: microId, url: microUrl },
      blurred: spot.blurredImage,
    }
  }

  return {
    id: `${spot.id}-${now.getTime()}`,
    spotId: spot.id,
    trailId: trailId,
    location: spot.location,
    source: source,
    discoveryRadius: spot.options.discoveryRadius,
    image: clueImage,
  }
}

/**
 * Returns spots as clues based on the trail's previewMode setting and spot visibility.
 * Filters out private spots that don't belong to the user.
 */
const getCluesBasedOnPreviewMode = (accountId: string, trail: Trail, discoveries: Discovery[], spots: Spot[], trailSpotIds: string[]): Clue[] => {
  if (trail.options?.previewMode !== 'preview') return []
  const discoveredSpotIds = getDiscoveredSpotIds(accountId, discoveries, trail.id)
  const previewSpotIds = trailSpotIds.filter(spotId => !discoveredSpotIds.includes(spotId))
  return previewSpotIds
    .map(spotId => getDiscoverySpot(spotId, spots))
    .filter(spot =>
      spot &&
      spot.options.visibility === 'preview' &&
      spot.createdBy !== accountId // Never show other users' spots as clues (includes private)
    )
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

  const snap = getDiscoverySnap(location, spots.filter(s => s.createdBy !== accountId), exploredSpotIds, trail.options?.snapRadius || trail.options.scannerRadius)

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
 * Creates a rating (1-5 stars) for a spot
 */
const createSpotRating = (accountId: string, spotId: string, rating: number): SpotRating => {
  // Validate rating is between 1-5
  const validRating = Math.max(1, Math.min(5, Math.round(rating)))

  return {
    id: createDeterministicId('spot-rating', spotId, accountId),
    spotId,
    accountId,
    rating: validRating,
    createdAt: new Date(),
  }
}

/**
 * Aggregates ratings into a summary with average and current user's rating
 */
const getSpotRatingSummary = (spotId: string, ratings: SpotRating[], accountId: string): RatingSummary => {
  const spotRatings = ratings.filter(r => r.spotId === spotId)
  const userRating = spotRatings.find(r => r.accountId === accountId)?.rating

  const count = spotRatings.length
  const average = count > 0
    ? spotRatings.reduce((sum, r) => sum + r.rating, 0) / count
    : 0

  return {
    average: Math.round(average * 10) / 10, // Round to 1 decimal
    count,
    userRating,
  }
}

/**
 * Pure function to calculate trail statistics for a user.
 */
const getTrailStats = (
  accountId: string,
  trailId: string,
  allDiscoveries: Discovery[],
  trailSpotIds: string[]
): TrailStats => {
  // Get user's discoveries for this trail
  const userTrailDiscoveries = allDiscoveries.filter(
    d => d.accountId === accountId && d.trailId === trailId
  )

  // Get unique discovered spot IDs
  const discoveredSpotIds = new Set(userTrailDiscoveries.map(d => d.spotId))
  const discoveredSpots = discoveredSpotIds.size
  const totalSpots = trailSpotIds.length
  const discoveriesCount = userTrailDiscoveries.length

  // Calculate progress
  const progressPercentage = totalSpots > 0 ? Math.round((discoveredSpots / totalSpots) * 100) : 0

  // Determine completion status
  let completionStatus: 'not_started' | 'in_progress' | 'completed' = 'not_started'
  if (discoveredSpots > 0) {
    completionStatus = discoveredSpots === totalSpots ? 'completed' : 'in_progress'
  }

  // Calculate rank among all trail discoverers
  const trailDiscoveries = allDiscoveries.filter(d => d.trailId === trailId)

  // Group discoveries by account
  const discovererMap = new Map<string, Set<string>>()
  for (const discovery of trailDiscoveries) {
    if (!discovererMap.has(discovery.accountId)) {
      discovererMap.set(discovery.accountId, new Set())
    }
    discovererMap.get(discovery.accountId)!.add(discovery.spotId)
  }

  // Calculate spots discovered per user and sort
  const discovererStats = Array.from(discovererMap.entries()).map(([accId, spotIds]) => ({
    accountId: accId,
    spotsDiscovered: spotIds.size
  })).sort((a, b) => b.spotsDiscovered - a.spotsDiscovered)

  // Find user's rank (0 if not started)
  let rank = 0
  if (discoveredSpots > 0) {
    const userIndex = discovererStats.findIndex(s => s.accountId === accountId)
    rank = userIndex + 1
  }

  const totalDiscoverers = discovererMap.size

  // Calculate time-based stats
  let firstDiscoveredAt: Date | undefined
  let lastDiscoveredAt: Date | undefined
  let averageTimeBetweenDiscoveries: number | undefined

  if (userTrailDiscoveries.length > 0) {
    const sortedDiscoveries = userTrailDiscoveries
      .sort((a, b) => new Date(a.discoveredAt).getTime() - new Date(b.discoveredAt).getTime())

    firstDiscoveredAt = sortedDiscoveries[0].discoveredAt
    lastDiscoveredAt = sortedDiscoveries[sortedDiscoveries.length - 1].discoveredAt

    // Calculate average time between discoveries (if more than 1)
    if (sortedDiscoveries.length > 1) {
      const firstTime = new Date(firstDiscoveredAt).getTime()
      const lastTime = new Date(lastDiscoveredAt).getTime()
      const totalTimeSeconds = (lastTime - firstTime) / 1000
      averageTimeBetweenDiscoveries = Math.round(totalTimeSeconds / (sortedDiscoveries.length - 1))
    }
  }

  return {
    trailId,
    totalSpots,
    discoveredSpots,
    discoveriesCount,
    progressPercentage,
    completionStatus,
    rank,
    totalDiscoverers,
    firstDiscoveredAt,
    lastDiscoveredAt,
    averageTimeBetweenDiscoveries
  }
}

export const createDiscoveryService = (): DiscoveryServiceActions => ({
  enrichSpotWithSource,
  enrichSpotsWithSource,
  filterSpotBySource,
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
  getTrailStats,
  createDiscoveryContent,
  updateDiscoveryContent,
  createSpotRating,
  getSpotRatingSummary,
})

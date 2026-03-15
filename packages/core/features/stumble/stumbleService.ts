import { StumbleFeedback, StumbleFeedbackVote, StumblePoi, StumblePreference, StumbleSuggestionResult, StumbleVisit } from '@shared/contracts/stumble.ts'
import { Poi } from '@core/connectors/poiConnector.ts'
import { createDeterministicId } from '@core/utils/idGenerator.ts'
import { geoUtils } from '@shared/geo/geoUtils.ts'

/**
 * Convert a provider Poi to a StumblePoi for DB storage.
 * Uses source-prefixed externalId for cross-provider deduplication.
 */
export const toStumblePoi = (poi: Poi, source = 'osm'): StumblePoi => {
  const externalId = `${source}:${poi.osmId ?? poi.id}`
  return {
    id: createDeterministicId('poi', externalId),
    externalId,
    name: poi.name ?? '',
    location: { lat: poi.lat, lon: poi.lon },
    poiType: poi.category,
    tags: poi.tags,
    source,
    address: poi.address,
    description: poi.description,
    feedbackScore: 0,
  }
}

/** Convert a stored StumblePoi to a client-facing StumbleSuggestionResult */
export const toSuggestionResult = (poi: StumblePoi, originLat?: number, originLon?: number): StumbleSuggestionResult => ({
  id: poi.id,
  location: poi.location,
  name: poi.name,
  category: poi.poiType,
  ...(poi.tags?.length ? { tags: poi.tags } : {}),
  ...(poi.externalId ? { osmId: poi.externalId } : {}),
  ...(poi.address ? { address: poi.address } : {}),
  ...(poi.description ? { description: poi.description } : {}),
  feedbackScore: poi.feedbackScore ?? 0,
  ...(originLat !== undefined && originLon !== undefined
    ? { distance: Math.round(geoUtils.calculateDistance({ lat: originLat, lon: originLon }, poi.location)) }
    : {}),
})

/**
 * Converts connector Poi list directly to StumbleSuggestionResults (legacy, for backward compat).
 */
export const toSuggestionResults = (pois: Poi[]): StumbleSuggestionResult[] =>
  pois
    .filter(poi => poi.name)
    .map(poi => ({
      id: `poi-${poi.id}`,
      location: { lat: poi.lat, lon: poi.lon },
      name: poi.name!,
      category: poi.category,
      ...(poi.tags?.length ? { tags: poi.tags } : {}),
      ...(poi.osmId ? { osmId: poi.osmId } : {}),
      ...(poi.address ? { address: poi.address } : {}),
      ...(poi.description ? { description: poi.description } : {}),
    }))

/**
 * Deduplicate new API POIs against existing DB POIs.
 * Matches by externalId or proximity (< 30m + same name).
 */
export const deduplicatePois = (newPois: StumblePoi[], existingPois: StumblePoi[]): StumblePoi[] => {
  const existingExternalIds = new Set(existingPois.map(p => p.externalId))

  return newPois.filter(newPoi => {
    // Exact externalId match
    if (existingExternalIds.has(newPoi.externalId)) return false

    // Proximity + name match (cross-provider dedup)
    const isDuplicate = existingPois.some(existing =>
      existing.name.toLowerCase() === newPoi.name.toLowerCase() &&
      geoUtils.calculateDistance(existing.location, newPoi.location) < 30
    )
    return !isDuplicate
  })
}

/** Filter POIs by preferences, sort by feedbackScore descending, limit to `limit`. */
export const filterAndRankPois = (
  pois: StumblePoi[],
  preferences: StumblePreference[],
  limit: number,
): StumblePoi[] => {
  const filtered = preferences.length > 0
    ? pois.filter(p => preferences.includes(p.poiType))
    : pois

  return filtered
    .sort((a, b) => (b.feedbackScore ?? 0) - (a.feedbackScore ?? 0))
    .slice(0, limit)
}

/**
 * Calculate the net score delta when a user submits a vote.
 * If the user already voted, the previous vote is reversed first.
 */
export const calculateFeedbackDelta = (
  newVote: StumbleFeedbackVote,
  existingVote?: StumbleFeedbackVote,
): number => {
  const newDelta = newVote === 'up' ? 1 : -1
  if (!existingVote) return newDelta
  const previousDelta = existingVote === 'up' ? 1 : -1
  return newDelta - previousDelta
}

/** Build a StumbleVisit entity. */
export const buildVisit = (accountId: string, poiId: string, spotId?: string): StumbleVisit => ({
  id: createDeterministicId(accountId, poiId),
  poiId,
  accountId,
  visitedAt: Math.floor(Date.now() / 1000),
  spotId,
})

/** Build a StumbleFeedback entity with a deterministic id. */
export const buildFeedback = (accountId: string, poiId: string, vote: StumbleFeedbackVote): StumbleFeedback => ({
  id: createDeterministicId(accountId, poiId, 'feedback'),
  poiId,
  accountId,
  vote,
  createdAt: Math.floor(Date.now() / 1000),
})

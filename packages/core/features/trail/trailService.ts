import { Discovery, Spot, Trail, TrailStats } from '@shared/contracts'

export interface TrailActions {
  getTrailById: (id: string) => Promise<Trail | null>
  getAllTrails: () => Promise<Trail[]>
  createTrail: (trail: Omit<Trail, 'id'>) => Promise<Trail>
  updateTrail: (id: string, trail: Partial<Trail>) => Promise<Trail | null>
  deleteTrail: (id: string) => Promise<boolean>
  getSpots: (trailId: string) => Spot[]
  getSpotById: (trailId: string, spotId: string) => Spot | null
}

export interface TrailServiceActions {
  getTrailStats: (accountId: string, trailId: string, allDiscoveries: Discovery[], trailSpotIds: string[]) => TrailStats
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

export const createTrailService = (): TrailServiceActions => ({
  getTrailStats
})

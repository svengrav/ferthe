import { getSensorDevice, SensorApplication } from '@app/features/sensor'
import { getTrailData } from '@app/features/trail'
import { logger } from '@app/shared/utils/logger'
import { AccountContext, Discovery, DiscoveryApplicationContract, DiscoveryContent, ReactionSummary, Result } from '@shared/contracts'
import { Unsubscribe } from '@shared/events/eventHandler'
import { GeoLocation, geoUtils } from '@shared/geo'
import { getTrails } from '../trail/stores/trailStore'
import { emitDiscoveryTrailUpdated, emitNewDiscoveries, onDiscoveryTrailUpdated, onNewDiscoveries } from './events/discoveryEvents'
import { discoveryService } from './logic/discoveryService'
import { DiscoveryCardState } from './logic/types'
import { getDiscoveryContentActions } from './stores/discoveryContentStore'
import { getDiscoveryReactionActions } from './stores/discoveryReactionStore'
import { getDiscoveryActions, getDiscoveryData } from './stores/discoveryStore'
import { getDiscoveryTrailActions, getDiscoveryTrailData, getDiscoveryTrailId } from './stores/discoveryTrailStore'

/**
 * ⚠️ Work in progress ⚠️
 * Default discovery trail slug used when no specific trail is set.
 * This is used to initialize the discovery application with a default trail.
 */
const DEFAULT_DISCOVERY_SLUG = 'discovery-trail-2025'

export interface DiscoveryApplication {
  setActiveTrail: (id: string) => void
  requestDiscoveryState: () => Promise<void>
  onDiscoveryTrailUpdate: (handler: (state: any) => void) => Unsubscribe
  onNewDiscoveries: (handler: (discoveries: DiscoveryCardState[]) => void) => Unsubscribe
  getDiscoveryCards: () => DiscoveryCardState[]
  // Content methods
  upsertDiscoveryContent: (discoveryId: string, content: { imageUrl?: string; comment?: string }) => Promise<Result<DiscoveryContent>>
  deleteDiscoveryContent: (discoveryId: string) => Promise<Result<void>>
  getDiscoveryContent: (discoveryId: string) => Promise<Result<DiscoveryContent | undefined>>
  // Reaction methods
  reactToDiscovery: (discoveryId: string, reaction: 'like' | 'dislike') => Promise<Result<void>>
  removeReaction: (discoveryId: string) => Promise<Result<void>>
  getReactionSummary: (discoveryId: string) => Promise<Result<ReactionSummary>>
}

type DiscoveryApplicationOptions = {
  getAccountContext: () => Promise<Result<AccountContext>>
  sensor?: SensorApplication
  discoveryAPI: DiscoveryApplicationContract
}

export function createDiscoveryApplication(options: DiscoveryApplicationOptions): DiscoveryApplication {
  const { sensor, discoveryAPI, getAccountContext } = options
  const { getDiscoveryTrail, getDiscoveredSpots, getDiscoveries, processLocation, updateDiscoveryProfile, getDiscoveryProfile } = discoveryAPI
  const { setDiscoveryTrail, setStatus, resetScannedClues } = getDiscoveryTrailActions()

  const thresholdState = {
    distance: 10,
    latestLocation: {
      lat: 0,
      lon: 0,
    },
  }

  const getSession = async (): Promise<Result<AccountContext>> => {
    const accountSession = await getAccountContext()
    if (!accountSession.data) return { success: false, data: undefined }
    return { success: true, data: accountSession.data }
  }

  sensor?.onScanEvent(async scanEvent => {
    if (scanEvent.clues.length > 0) {
      const accountSession = await getAccountContext()

      if (!accountSession.data) return

      const result = await getDiscoveryTrail(accountSession.data, scanEvent.trailId!)
      if (!result.data) return

      // Filter scanned clues to exclude those that are already in preview clues
      const previewClues = result.data.clues || []
      const uniqueScannedClues = scanEvent.clues.filter(
        scannedClue =>
          !previewClues.some(
            previewClue =>
              previewClue.spotId === scannedClue.spotId && previewClue.location.lat === scannedClue.location.lat && previewClue.location.lon === scannedClue.location.lon
          )
      )

      const { trail, spots, createdAt } = result.data
      const discoveryTrail = {
        trailId: trail?.id,
        updatedAt: createdAt,
        trail: trail,
        scannedClues: [...uniqueScannedClues],
        previewClues: [...previewClues],
        spots: spots,
        discoveries: [] as Discovery[],
        status: 'ready' as const,
      }
      const discovery = getDiscoveryTrailData()

      setDiscoveryTrail({ ...discovery, scannedClues: scanEvent.clues, updatedAt: createdAt })
      emitDiscoveryTrailUpdated(discoveryTrail)

      // Clear scanned clues after 4 seconds
      setTimeout(() => {
        const currentDiscovery = getDiscoveryTrailData()
        resetScannedClues()
        emitDiscoveryTrailUpdated(currentDiscovery)
      }, 2000)
    }
  })

  sensor?.onDeviceUpdate(device => {
    processLocationUpdate(device)
  })

  const setDefaultTrail = async () => {
    const trails = getTrails()
    const defaultTrail = trails.find(t => t.slug === DEFAULT_DISCOVERY_SLUG)
    if (!defaultTrail) throw new Error(`Default discovery trail '${DEFAULT_DISCOVERY_SLUG}' not found!`)

    await setActiveTrail(defaultTrail.id)
  }

  const setActiveTrail = async (id: string) => {
    setStatus('loading')
    const accountSession = await getSession()
    if (!accountSession.data) throw new Error('Account session not found!')

    const device = getSensorDevice()

    const { trails } = getTrailData()
    const trail = trails.find(t => t.id === id)
    if (!trail) return

    // Update profile with new lastActiveTrailId
    try {
      await updateDiscoveryProfile(accountSession.data, { lastActiveTrailId: id })
      logger.log(`Updated profile with lastActiveTrailId: ${id}`)
    } catch (error) {
      logger.error('Error updating discovery profile:', error)
    }

    const result = await getDiscoveryTrail(accountSession.data, id, device.location)
    if (!result.data) return

    const { clues, spots, createdAt, previewClues } = result.data

    const discoveryTrail = {
      trailId: trail.id,
      updatedAt: createdAt,
      trail: trail,
      clues: [...clues],
      scannedClues: [],
      previewClues: [...(previewClues || [])],
      spots: spots,
      discoveries: [] as Discovery[],
      status: 'ready' as const,
    }
    setDiscoveryTrail(discoveryTrail)

    emitDiscoveryTrailUpdated(discoveryTrail)
  }

  const loadDiscoveryTrailFromProfile = async (accountSession: AccountContext) => {
    const profileResult = await getDiscoveryProfile(accountSession)

    if (profileResult.data?.lastActiveTrailId) {
      // Use trail from profile
      await setActiveTrail(profileResult.data.lastActiveTrailId)
      logger.log(`Discovery state requested and set active trail from profile: ${profileResult.data.lastActiveTrailId}`)
    } else {
      // No trail in profile, use default
      await setDefaultTrail()
      logger.log('Discovery state requested and default trail set.')
    }
  }

  const requestDiscoveryState = async () => {
    const accountSession = await getSession()
    if (!accountSession.data) throw new Error('Account session not found!')

    const { setDiscoveries, setSpots } = getDiscoveryActions()

    const promises = [
      getDiscoveries(accountSession.data).then(discoveries => {
        logger.log('Fetched discoveries:', discoveries.data)
        discoveries.data && setDiscoveries(discoveries.data)
      }),
      getDiscoveredSpots(accountSession.data).then(spots => {
        logger.log('Fetched spots:', spots.data)
        spots.data && setSpots(spots.data)
      }),
    ]

    await Promise.all(promises).catch(error => logger.error('Error retrieving discovery data:', error))

    // Load profile and set active trail from profile or use default
    try {
      const profileResult = await getDiscoveryProfile(accountSession.data)

      if (profileResult.data?.lastActiveTrailId) {
        // Use trail from profile
        await setActiveTrail(profileResult.data.lastActiveTrailId)
        logger.log(`Discovery state requested and set active trail from profile: ${profileResult.data.lastActiveTrailId}`)
      } else {
        // No trail in profile, use default
        await setDefaultTrail()
        logger.log('Discovery state requested and default trail set.')
      }
    } catch (error) {
      logger.error('Error loading discovery profile, falling back to default trail:', error)
      await setDefaultTrail()
    }

    setStatus('ready')
  }

  const getDiscoveryCards = () => {
    return discoveryService.createDiscoveryCards(getDiscoveryData().discoveries, getDiscoveryData().spots)
  }

  const handleNewDiscoveries = async (
    newDiscoveries: Discovery[],
    trailId: string,
    accountContext: AccountContext,
    snap?: { distance: number; intensity: number }
  ) => {
    const { setDiscoveries, setSpots } = getDiscoveryActions()
    const { discoveries } = getDiscoveryData()

    setDiscoveries([...discoveries, ...newDiscoveries])

    const allDiscoveries = [...discoveries, ...newDiscoveries]
    const allDiscoveredSpotIds = allDiscoveries.map(d => d.spotId)
    const currentTrailData = getDiscoveryTrailData()
    const filteredClues = currentTrailData.scannedClues.filter(clue => !allDiscoveredSpotIds.includes(clue.spotId))
    const filteredPreviewClues = currentTrailData.previewClues?.filter(clue => !allDiscoveredSpotIds.includes(clue.spotId))

    setDiscoveryTrail({
      ...currentTrailData,
      trail: currentTrailData.trail,
      discoveries: [...currentTrailData.discoveries, ...newDiscoveries],
      snap: snap,
      trailId: currentTrailData.trailId,
      scannedClues: filteredClues,
      previewClues: filteredPreviewClues,
      lastDiscovery: newDiscoveries[newDiscoveries.length - 1],
      updatedAt: new Date(),
    })

    await setActiveTrail(trailId)

    const spotsResult = await getDiscoveredSpots(accountContext)
    if (spotsResult.data) {
      setSpots(spotsResult.data)
    }

    emitNewDiscoveries(discoveryService.createDiscoveryCards(newDiscoveries, getDiscoveryData().spots))
  }

  const processLocationUpdate = async (position: { location: GeoLocation; heading: number }) => {
    const accountSession = await getSession()
    if (!accountSession.data) throw new Error('Account session not found!')

    const { setSnap } = getDiscoveryTrailActions()
    const { status } = getDiscoveryTrailData()
    const trailId = getDiscoveryTrailId()

    if (status === 'loading' || !trailId) {
      logger.log('Processing skipped due to loading status or missing trail ID')
      return
    }

    if (geoUtils.calculateDistance(thresholdState.latestLocation, position.location) < thresholdState.distance) {
      logger.log('Location update ignored, within threshold distance')
      return
    }

    const locationWithDirection = {
      location: position.location,
      direction: position.heading,
    }

    const locationResult = await processLocation(accountSession.data, locationWithDirection, trailId)
    if (!locationResult.data) return

    locationResult.data.snap && setSnap(locationResult.data.snap)

    const newDiscoveries = locationResult.data.discoveries
    if (newDiscoveries.length > 0) {
      await handleNewDiscoveries(newDiscoveries, trailId, accountSession.data, locationResult.data.snap)
    } else {
      logger.log('No new discoveries from location update')
    }
  }

  // Content methods
  const upsertDiscoveryContent = async (discoveryId: string, content: { imageUrl?: string; comment?: string }): Promise<Result<DiscoveryContent>> => {
    const session = await getSession()
    if (!session.data) return { success: false, data: undefined as any }

    const result = await discoveryAPI.upsertDiscoveryContent(session.data, discoveryId, content)
    if (result.data) {
      getDiscoveryContentActions().setContent(discoveryId, result.data)
    }
    return result
  }

  const getDiscoveryContent = async (discoveryId: string): Promise<Result<DiscoveryContent | undefined>> => {
    const session = await getSession()
    if (!session.data) return { success: false, data: undefined }

    const result = await discoveryAPI.getDiscoveryContent(session.data, discoveryId)
    if (result.data) {
      getDiscoveryContentActions().setContent(discoveryId, result.data)
    }
    return result
  }

  const deleteDiscoveryContent = async (discoveryId: string): Promise<Result<void>> => {
    const session = await getSession()
    if (!session.data) return { success: false, data: undefined }

    const result = await discoveryAPI.deleteDiscoveryContent(session.data, discoveryId)
    if (result.success) {
      getDiscoveryContentActions().clearContent(discoveryId)
    }
    return result
  }

  // Reaction methods
  const reactToDiscovery = async (discoveryId: string, reaction: 'like' | 'dislike'): Promise<Result<void>> => {
    const session = await getSession()
    if (!session.data) return { success: false, data: undefined }

    const result = await discoveryAPI.reactToDiscovery(session.data, discoveryId, reaction)
    if (result.success) {
      // Refresh reaction summary
      const summaryResult = await discoveryAPI.getReactionSummary(session.data, discoveryId)
      if (summaryResult.data) {
        getDiscoveryReactionActions().setReactionSummary(discoveryId, summaryResult.data)
      }
    }
    return { success: result.success, data: undefined }
  }

  const removeReaction = async (discoveryId: string): Promise<Result<void>> => {
    const session = await getSession()
    if (!session.data) return { success: false, data: undefined }

    const result = await discoveryAPI.removeReaction(session.data, discoveryId)
    if (result.success) {
      const summaryResult = await discoveryAPI.getReactionSummary(session.data, discoveryId)
      if (summaryResult.data) {
        getDiscoveryReactionActions().setReactionSummary(discoveryId, summaryResult.data)
      }
    }
    return result
  }

  const getReactionSummary = async (discoveryId: string): Promise<Result<ReactionSummary>> => {
    const session = await getSession()
    if (!session.data) return { success: false, data: undefined as any }

    const result = await discoveryAPI.getReactionSummary(session.data, discoveryId)
    if (result.data) {
      getDiscoveryReactionActions().setReactionSummary(discoveryId, result.data)
    }
    return result
  }

  return {
    getDiscoveryCards,
    setActiveTrail,
    requestDiscoveryState,
    onDiscoveryTrailUpdate: onDiscoveryTrailUpdated,
    onNewDiscoveries,
    upsertDiscoveryContent,
    deleteDiscoveryContent,
    getDiscoveryContent,
    reactToDiscovery,
    removeReaction,
    getReactionSummary,
  }
}

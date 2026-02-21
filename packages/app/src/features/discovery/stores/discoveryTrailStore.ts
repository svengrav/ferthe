import { getSpotsById } from '@app/features/spot/stores/spotStore'
import { Status, StoreActions, StoreState } from '@app/shared/stores/types'
import { Clue, Discovery, DiscoverySpot } from '@shared/contracts'
import { create } from 'zustand'
import { getDiscoveriesById } from './discoveryStore'

interface DiscoverySnap {
  intensity: number
  distance: number
}

interface DiscoveryTrailActions extends StoreActions {
  setScannedClues: (clues: Clue[]) => void
  resetScannedClues: () => void
  setDiscoveryTrail: (discoveryTrail: Partial<DiscoveryTrailState>) => void
  setSnap: (snap: DiscoverySnap) => void
}

interface DiscoveryTrailState extends StoreState {
  status: Status
  trailId: string | undefined
  scannedClues: Clue[]
  discoveryIds: string[]
  previewClues?: Clue[]
  spotIds: string[]
  snap?: DiscoverySnap | undefined
  lastDiscoveryId?: string
}

export const discoveryTrailStore = create<DiscoveryTrailState & DiscoveryTrailActions>(set => ({
  // Metadata
  updatedAt: new Date(0),
  status: 'uninitialized',
  error: undefined,

  // Discovery Trail specific data
  trailId: undefined,
  discoveryIds: [],
  spotIds: [],
  scannedClues: [],
  previewClues: [],
  snap: undefined,
  lastDiscoveryId: undefined,

  // Actions
  setScannedClues: clues => set({ scannedClues: clues }),
  resetScannedClues: () => set({ scannedClues: [] }),
  setStatus: status => set({ status }),
  setDiscoveryTrail: data => set({ ...data }),
  setSnap: snap => set({ snap }),
}))

export const useDiscoveryTrailStatus = () => discoveryTrailStore(state => state.status)
export const useDiscoveryTrail = () => discoveryTrailStore(state => state)
export const useDiscoveryTrailId = () => discoveryTrailStore(state => state.trailId)
export const useDiscoverySpotIds = () => discoveryTrailStore(state => state.spotIds)
export const useDiscoveryPreviewClues = () => discoveryTrailStore(state => state.previewClues)
export const useDiscoveryScannedClues = () => discoveryTrailStore(state => state.scannedClues)

export const getDiscoveryTrailId = () => discoveryTrailStore.getState().trailId
export const getDiscoveryTrailData = () => discoveryTrailStore.getState() as DiscoveryTrailState

/**
 * Get denormalized DiscoverySpot array by merging spotIds with data from spotStore and discoveryStore
 */
export const getDiscoverySpots = (): DiscoverySpot[] => {
  const { spotIds } = discoveryTrailStore.getState()
  const spotsById = getSpotsById()
  const discoveriesById = getDiscoveriesById()

  return spotIds
    .map(spotId => {
      const spot = spotsById[spotId]
      const discovery = (Object.values(discoveriesById) as Discovery[]).find(d => d.spotId === spotId)
      if (!spot || !discovery) return undefined

      const discoverySpot: DiscoverySpot = {
        ...spot,
        discoveryId: discovery.id,
        discoveredAt: discovery.discoveredAt,
      }

      return discoverySpot
    })
    .filter(Boolean) as DiscoverySpot[]
}

export const getDiscoveryTrailActions = () => ({
  setScannedClues: discoveryTrailStore.getState().setScannedClues,
  resetScannedClues: discoveryTrailStore.getState().resetScannedClues,
  setDiscoveryTrail: discoveryTrailStore.getState().setDiscoveryTrail,
  setStatus: discoveryTrailStore.getState().setStatus,
  setSnap: discoveryTrailStore.getState().setSnap,
})

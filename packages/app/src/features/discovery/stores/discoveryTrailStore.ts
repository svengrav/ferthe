import { Status, StoreActions, StoreState } from '@app/shared/index'
import { Clue, Discovery, DiscoverySpot, Trail } from '@shared/contracts'
import { create } from 'zustand'

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
  trail: Trail | undefined
  scannedClues: Clue[]
  discoveries: Discovery[]
  previewClues?: Clue[]
  spots: DiscoverySpot[]
  snap?: DiscoverySnap | undefined
  lastDiscovery?: Discovery
}

export const discoveryTrailStore = create<DiscoveryTrailState & DiscoveryTrailActions>(set => ({
  // Metadata
  updatedAt: new Date(0),
  status: 'uninitialized',
  error: undefined,

  // Discovery Trail specific data
  trailId: undefined,
  trail: undefined,
  discoveries: [],
  spots: [],
  scannedClues: [],
  previewClues: [],
  snap: undefined,
  lastDiscovery: undefined,

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
export const useDiscoverySpots = () => discoveryTrailStore(state => state.spots)
export const useDiscoveryPreviewClues = () => discoveryTrailStore(state => state.previewClues)
export const useDiscoveryScannedClues = () => discoveryTrailStore(state => state.scannedClues)

export const getDiscoveryTrailId = () => discoveryTrailStore.getState().trailId
export const getDiscoveryTrailData = () => discoveryTrailStore.getState() as DiscoveryTrailState
export const getDiscoveryTrailActions = () => ({
  setScannedClues: discoveryTrailStore.getState().setScannedClues,
  resetScannedClues: discoveryTrailStore.getState().resetScannedClues,
  setDiscoveryTrail: discoveryTrailStore.getState().setDiscoveryTrail,
  setStatus: discoveryTrailStore.getState().setStatus,
  setSnap: discoveryTrailStore.getState().setSnap,
})

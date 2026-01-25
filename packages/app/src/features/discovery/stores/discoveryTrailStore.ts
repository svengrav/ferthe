import { StoreActions, StoreData } from '@app/shared/index'
import { Clue, Discovery, DiscoverySpot, Trail } from '@shared/contracts'
import { create } from 'zustand'

interface DiscoverySnap {
  intensity: number
  distance: number
}

interface DiscoveryTrailActions extends StoreActions {
  setScannedClues: (clues: Clue[]) => void
  resetScannedClues: () => void
  setDiscoveryTrail: (discoveryTrail: Partial<DiscoveryTrailData>) => void
  setSnap: (snap: DiscoverySnap) => void
}

interface DiscoveryTrailData extends StoreData {
  trailId: string | undefined
  trail: Trail | undefined
  scannedClues: Clue[]
  discoveries: Discovery[]
  previewClues?: Clue[]
  spots: DiscoverySpot[]
  snap?: DiscoverySnap | undefined
  lastDiscovery?: Discovery
}

export const discoveryTrailStore = create<DiscoveryTrailData & DiscoveryTrailActions>(set => ({
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

export const getDiscoveryTrailId = () => discoveryTrailStore.getState().trailId
export const getDiscoveryTrailData = () => discoveryTrailStore.getState() as DiscoveryTrailData
export const getDiscoveryTrailActions = () => ({
  setScannedClues: discoveryTrailStore.getState().setScannedClues,
  resetScannedClues: discoveryTrailStore.getState().resetScannedClues,
  setDiscoveryTrail: discoveryTrailStore.getState().setDiscoveryTrail,
  setStatus: discoveryTrailStore.getState().setStatus,
  setSnap: discoveryTrailStore.getState().setSnap,
})

import { Status, StoreActions, StoreState } from '@app/shared/index'
import { Discovery, DiscoverySpot, DiscoveryStats } from '@shared/contracts'
import { create } from 'zustand'
import { DiscoveryEventState } from '../logic/types'

interface DiscoveryActions extends StoreActions {
  setDiscoveries: (discoveries: Discovery[]) => void
  setSpots: (spots: DiscoverySpot[]) => void
  setDiscoveryStats: (discoveryId: string, stats: DiscoveryStats) => void
  setDiscoveryEvent: (discovery: DiscoveryEventState) => void
}

interface DiscoveryState extends StoreState {
  status: Status
  discoveries: Discovery[]
  spots: DiscoverySpot[]
  discoveryStats: Record<string, DiscoveryStats>
  discoveryEvent?: DiscoveryEventState
}

export const discoveryStore = create<DiscoveryState & DiscoveryActions>(set => ({
  // Metadata
  updatedAt: new Date(0),
  status: 'uninitialized',
  error: undefined,

  discoveries: [],
  spots: [],
  discoveryStats: {},
  discoveryEvent: undefined,

  setDiscoveryEvent: (discoveryEvent: DiscoveryEventState) => set({ discoveryEvent }),
  setStatus: status => set({ status }),
  setSpots: spots => set({ spots }),
  setDiscoveries: discoveries => set({ discoveries }),
  setDiscoveryStats: (discoveryId, stats) => set(state => ({
    discoveryStats: { ...state.discoveryStats, [discoveryId]: stats },
  })),
}))

export const useDiscoveryStatus = () => discoveryStore(state => state.status)
export const useDiscoveryData = () => discoveryStore(state => state)
export const useDiscoverySpots = (discoveryIds?: string[]) => discoveryStore(state => state.spots.filter(discoverySpot => discoveryIds?.includes(discoverySpot.discoveryId)))
export const useDiscoveryEvent = () => discoveryStore(state => state.discoveryEvent)

export const getDiscoverySpot = (spotId: string) => discoveryStore.getState().spots.find(discoverySpot => discoverySpot.id === spotId)
export const getDiscoverySpots = () => discoveryStore.getState().spots
export const getDiscoveryData = () => discoveryStore.getState()
export const getDiscoveryActions = () => ({
  setDiscoveries: discoveryStore.getState().setDiscoveries,
  setSpots: discoveryStore.getState().setSpots,
  setStatus: discoveryStore.getState().setStatus,
  setDiscoveryStats: discoveryStore.getState().setDiscoveryStats,
  setDiscoveryEvent: discoveryStore.getState().setDiscoveryEvent
})

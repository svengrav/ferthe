import { Status, StoreActions, StoreState } from '@app/shared/index'
import { Discovery, DiscoveryStats } from '@shared/contracts'
import { create } from 'zustand'
import { DiscoveryEventState } from '../logic/types'

interface DiscoveryActions extends StoreActions {
  setDiscoveries: (discoveries: Discovery[]) => void
  setDiscoveryStats: (discoveryId: string, stats: DiscoveryStats) => void
  setDiscoveryEvent: (discovery: DiscoveryEventState) => void
}

interface DiscoveryState extends StoreState {
  status: Status
  discoveries: Discovery[]
  discoveryStats: Record<string, DiscoveryStats>
  discoveryEvent?: DiscoveryEventState
}

export const discoveryStore = create<DiscoveryState & DiscoveryActions>(set => ({
  // Metadata
  updatedAt: new Date(0),
  status: 'uninitialized',
  error: undefined,

  discoveries: [],
  discoveryStats: {},
  discoveryEvent: undefined,

  setDiscoveryEvent: (discoveryEvent: DiscoveryEventState) => set({ discoveryEvent }),
  setStatus: status => set({ status }),
  setDiscoveries: discoveries => set({ discoveries }),
  setDiscoveryStats: (discoveryId, stats) => set(state => ({
    discoveryStats: { ...state.discoveryStats, [discoveryId]: stats },
  })),
}))

export const useDiscoveryStatus = () => discoveryStore(state => state.status)
export const useDiscoveries = () => discoveryStore(state => state.discoveries)
export const useDiscoveryData = () => discoveryStore(state => state)
export const useDiscoveryEvent = () => discoveryStore(state => state.discoveryEvent)

export const getDiscoveries = () => discoveryStore.getState().discoveries
export const getDiscoveryData = () => discoveryStore.getState()
export const getDiscoveryActions = () => ({
  setDiscoveries: discoveryStore.getState().setDiscoveries,
  setStatus: discoveryStore.getState().setStatus,
  setDiscoveryStats: discoveryStore.getState().setDiscoveryStats,
  setDiscoveryEvent: discoveryStore.getState().setDiscoveryEvent
})

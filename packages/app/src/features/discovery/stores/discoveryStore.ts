import { Status, StoreActions, StoreState } from '@app/shared/stores/types'
import { Discovery, DiscoveryStats } from '@shared/contracts'
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { DiscoveryEventState } from '../services/types'

/**
 * Converts an array of items with `id` to a Record keyed by id.
 */
const toById = <T extends { id: string }>(items: T[]): Record<string, T> =>
  Object.fromEntries(items.map(item => [item.id, item]))

interface DiscoveryActions extends StoreActions {
  setDiscoveries: (discoveries: Discovery[]) => void
  upsertDiscoveries: (discoveries: Discovery[]) => void
  setDiscoveryStats: (discoveryId: string, stats: DiscoveryStats) => void
  setDiscoveryEvent: (discovery: DiscoveryEventState) => void
}

interface DiscoveryState extends StoreState {
  status: Status
  byId: Record<string, Discovery>
  discoveryStats: Record<string, DiscoveryStats>
  discoveryEvent?: DiscoveryEventState
}

export const discoveryStore = create<DiscoveryState & DiscoveryActions>(set => ({
  // Metadata
  updatedAt: new Date(0),
  status: 'uninitialized',
  error: undefined,

  byId: {},
  discoveryStats: {},
  discoveryEvent: undefined,

  setDiscoveryEvent: (discoveryEvent: DiscoveryEventState) => set({ discoveryEvent }),
  setStatus: status => set({ status }),
  setDiscoveries: discoveries => set({ byId: toById(discoveries) }),
  upsertDiscoveries: discoveries => set(state => ({
    byId: { ...state.byId, ...toById(discoveries) },
  })),
  setDiscoveryStats: (discoveryId, stats) => set(state => ({
    discoveryStats: { ...state.discoveryStats, [discoveryId]: stats },
  })),
}))

export const useDiscoveryStatus = () => discoveryStore(state => state.status)
export const useDiscoveries = () => discoveryStore(useShallow(state => Object.values(state.byId)))
export const useDiscovery = (discoveryId: string) => discoveryStore(state => state.byId[discoveryId])
export const useDiscoveryBySpotId = (spotId: string) => discoveryStore(useShallow(state =>
  Object.values(state.byId).find(d => d.spotId === spotId)
))
export const useDiscoveryData = () => discoveryStore(state => state)
export const useDiscoveryEvent = () => discoveryStore(state => state.discoveryEvent)

export const getDiscoveries = () => Object.values(discoveryStore.getState().byId)
export const getDiscoveriesById = () => discoveryStore.getState().byId
export const getDiscoveryData = () => discoveryStore.getState()
export const getDiscoveryActions = () => ({
  setDiscoveries: discoveryStore.getState().setDiscoveries,
  upsertDiscoveries: discoveryStore.getState().upsertDiscoveries,
  setStatus: discoveryStore.getState().setStatus,
  setDiscoveryStats: discoveryStore.getState().setDiscoveryStats,
  setDiscoveryEvent: discoveryStore.getState().setDiscoveryEvent
})

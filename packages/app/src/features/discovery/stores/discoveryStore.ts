import { StoreActions, StoreData } from '@app/shared/index'
import { Discovery, DiscoverySpot } from '@shared/contracts'
import { create } from 'zustand'

interface DiscoveryActions extends StoreActions {
  setDiscoveries: (discoveries: Discovery[]) => void
  setSpots: (spots: DiscoverySpot[]) => void
}

interface DiscoveryData extends StoreData {
  discoveries: Discovery[]
  spots: DiscoverySpot[]
}

export const discoveryStore = create<DiscoveryData & DiscoveryActions>(set => ({
  // Metadata
  updatedAt: new Date(0),
  status: 'uninitialized',
  error: undefined,

  discoveries: [],
  spots: [],

  setStatus: status => set({ status }),
  setSpots: spots => set({ spots }),
  setDiscoveries: discoveries => set({ discoveries }),
}))

export const useDiscoveryStatus = () => discoveryStore(state => state.status)
export const useDiscoveryData = () => discoveryStore(state => state)
export const useDiscoverySpots = (discoveryIds?: string[]) => discoveryStore(state => state.spots.filter(discoverySpot => discoveryIds?.includes(discoverySpot.discoveryId)))

export const getDiscoverySpot = (spotId: string) => discoveryStore.getState().spots.find(discoverySpot => discoverySpot.id === spotId)
export const getDiscoverySpots = () => discoveryStore.getState().spots
export const getDiscoveryData = () => discoveryStore.getState()
export const getDiscoveryActions = () => ({
  setDiscoveries: discoveryStore.getState().setDiscoveries,
  setSpots: discoveryStore.getState().setSpots,
  setStatus: discoveryStore.getState().setStatus,
})

import { Status, StoreActions, StoreState } from '@app/shared/index'
import { Spot } from '@shared/contracts'
import { create } from 'zustand'

interface SpotActions extends StoreActions {
  setSpots: (spots: Spot[]) => void
}

interface SpotState extends StoreState {
  status: Status
  spots: Spot[]
}

export const spotStore = create<SpotState & SpotActions>(set => ({
  // Metadata
  updatedAt: new Date(0),
  status: 'uninitialized',
  error: undefined,

  // Spot specific data
  spots: [],

  setStatus: status => set({ status }),
  setSpots: spots => set({ spots }),
}))

export const useSpotStatus = () => spotStore(state => state.status)
export const useSpotStoreData = () => spotStore(state => state)
export const useSpots = () => spotStore(state => state.spots)
export const useSpot = (spotId: string) => spotStore(state => state.spots.find(s => s.id === spotId))

export const getSpotStoreActions = () => ({
  setSpots: spotStore.getState().setSpots,
  setStatus: spotStore.getState().setStatus,
})

export const getSpotData = () => ({
  spots: spotStore.getState().spots,
  status: spotStore.getState().status,
  error: spotStore.getState().error,
  updatedAt: spotStore.getState().updatedAt,
})

export const getSpots = () => spotStore.getState().spots
export const getSpot = (spotId: string) => spotStore.getState().spots.find(s => s.id === spotId)

import { StoreActions, StoreData } from '@app/shared/index'
import { SpotPreview, Trail } from '@shared/contracts'
import { create } from 'zustand'

interface TrailActions extends StoreActions {
  setTrails: (trails: Trail[]) => void
  setSpots: (spots: SpotPreview[]) => void
}

interface TrailData extends StoreData {
  trails: Trail[]
  spots: SpotPreview[]
}

export const trailStore = create<TrailData & TrailActions>(set => ({
  // Metadata
  updatedAt: new Date(0),
  status: 'uninitialized',
  error: undefined,

  // Trail specific data
  trails: [],
  spots: [],

  setStatus: status => set({ status }),
  setTrails: trails => set({ trails }),
  setSpots: spots => set({ spots }),
}))

export const useTrailStatus = () => trailStore(state => state.status)
export const useTrailData = () => trailStore(state => state)
export const useTrails = () => trailStore(state => state.trails)
export const useTrailPreviewSpots = (trailId: string) => trailStore(state => state.spots)

export const getTrailStoreActions = () => ({
  setTrails: trailStore.getState().setTrails,
  setStatus: trailStore.getState().setStatus,
  setSpots: trailStore.getState().setSpots,
})

export const getTrailData = () => ({
  trails: trailStore.getState().trails,
  status: trailStore.getState().status,
  error: trailStore.getState().error,
  updatedAt: trailStore.getState().updatedAt,
})

export const getTrails = () => trailStore.getState().trails

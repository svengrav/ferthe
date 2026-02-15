import { Status, StoreActions, StoreData } from '@app/shared/index'
import { SpotPreview, Trail, TrailStats } from '@shared/contracts'
import { create } from 'zustand'

interface TrailActions extends StoreActions {
  setTrails: (trails: Trail[]) => void
  setSpots: (spots: SpotPreview[]) => void
  setTrailStats: (trailId: string, stats: TrailStats) => void
}

interface TrailData extends StoreData {
  status: Status
  trails: Trail[]
  spots: SpotPreview[]
  trailStats: Record<string, TrailStats>
}

export const trailStore = create<TrailData & TrailActions>(set => ({
  // Metadata
  updatedAt: new Date(0),
  status: 'uninitialized',
  error: undefined,

  // Trail specific data
  trails: [],
  spots: [],
  trailStats: {},

  setStatus: status => set({ status }),
  setTrails: trails => set({ trails }),
  setSpots: spots => set({ spots }),
  setTrailStats: (trailId, stats) => set(state => ({
    trailStats: { ...state.trailStats, [trailId]: stats },
  })),
}))

export const useTrailStatus = () => trailStore(state => state.status)
export const useTrailData = () => trailStore(state => state)
export const useTrails = () => trailStore(state => state.trails)
export const useTrailPreviewSpots = (trailId: string) => trailStore(state => state.spots)

export const getTrailStoreActions = () => ({
  setTrails: trailStore.getState().setTrails,
  setStatus: trailStore.getState().setStatus,
  setSpots: trailStore.getState().setSpots,
  setTrailStats: trailStore.getState().setTrailStats,
})

export const getTrailData = () => ({
  trails: trailStore.getState().trails,
  status: trailStore.getState().status,
  error: trailStore.getState().error,
  updatedAt: trailStore.getState().updatedAt,
})

export const getTrails = () => trailStore.getState().trails

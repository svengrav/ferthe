import { Status, StoreActions, StoreState } from '@app/shared/index'
import { SpotPreview, Trail, TrailStats } from '@shared/contracts'
import { create } from 'zustand'

interface TrailActions extends StoreActions {
  setTrails: (trails: Trail[]) => void
  setTrailSpotIds: (trailId: string, spotIds: string[]) => void
  setPreviewSpots: (spots: SpotPreview[]) => void
  setTrailStats: (trailId: string, stats: TrailStats) => void
}

interface TrailState extends StoreState {
  status: Status
  trails: Trail[]
  trailSpotIds: Record<string, string[]> // Map of trailId -> spotIds
  previewSpots: SpotPreview[] // Undiscovered spots for all trails
  trailStats: Record<string, TrailStats>
}

export const trailStore = create<TrailState & TrailActions>(set => ({
  // Metadata
  updatedAt: new Date(0),
  status: 'uninitialized',
  error: undefined,

  // Trail specific data
  trails: [],
  trailSpotIds: {},
  previewSpots: [],
  trailStats: {},

  setStatus: status => set({ status }),
  setTrails: trails => set({ trails }),
  setTrailSpotIds: (trailId, spotIds) => set(state => ({
    trailSpotIds: { ...state.trailSpotIds, [trailId]: spotIds },
  })),
  setPreviewSpots: spots => set({ previewSpots: spots }),
  setTrailStats: (trailId, stats) => set(state => ({
    trailStats: { ...state.trailStats, [trailId]: stats },
  })),
}))

// Helper to get an empty array with stable reference
const emptyArray: string[] = []

export const useTrailStatus = () => trailStore(state => state.status)
export const useTrailData = () => trailStore(state => state)
export const useTrails = () => trailStore(state => state.trails)
export const useTrailSpotIds = (trailId: string) => trailStore(state => state.trailSpotIds[trailId] ?? emptyArray)
export const usePreviewSpots = () => trailStore(state => state.previewSpots)

export const getTrailStoreActions = () => ({
  setTrails: trailStore.getState().setTrails,
  setStatus: trailStore.getState().setStatus,
  setTrailSpotIds: trailStore.getState().setTrailSpotIds,
  setPreviewSpots: trailStore.getState().setPreviewSpots,
  setTrailStats: trailStore.getState().setTrailStats,
})

export const getTrailData = () => ({
  trails: trailStore.getState().trails,
  status: trailStore.getState().status,
  error: trailStore.getState().error,
  updatedAt: trailStore.getState().updatedAt,
})

export const getTrails = () => trailStore.getState().trails

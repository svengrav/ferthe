import { Status, StoreActions, StoreState } from '@app/shared/index'
import { Trail, TrailStats } from '@shared/contracts'
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

/**
 * Converts an array of items with `id` to a Record keyed by id.
 */
const toById = <T extends { id: string }>(items: T[]): Record<string, T> =>
  Object.fromEntries(items.map(item => [item.id, item]))

interface TrailActions extends StoreActions {
  setTrails: (trails: Trail[]) => void
  setTrailSpotIds: (trailId: string, spotIds: string[]) => void
  setTrailStats: (trailId: string, stats: TrailStats) => void
}

interface TrailState extends StoreState {
  status: Status
  byId: Record<string, Trail>
  trailSpotIds: Record<string, string[]>
  trailStats: Record<string, TrailStats>
}

export const trailStore = create<TrailState & TrailActions>(set => ({
  // Metadata
  updatedAt: new Date(0),
  status: 'uninitialized',
  error: undefined,

  // Trail specific data
  byId: {},
  trailSpotIds: {},
  trailStats: {},

  setStatus: status => set({ status }),
  setTrails: trails => set({ byId: toById(trails) }),
  setTrailSpotIds: (trailId, spotIds) => set(state => ({
    trailSpotIds: { ...state.trailSpotIds, [trailId]: spotIds },
  })),
  setTrailStats: (trailId, stats) => set(state => ({
    trailStats: { ...state.trailStats, [trailId]: stats },
  })),
}))

// Helper to get an empty array with stable reference
const emptyArray: string[] = []

export const useTrailStatus = () => trailStore(state => state.status)
export const useTrailData = () => trailStore(state => state)
export const useTrails = () => trailStore(useShallow(state => Object.values(state.byId)))
export const useTrail = (trailId: string) => trailStore(state => state.byId[trailId])
export const useTrailSpotIds = (trailId: string) => trailStore(state => state.trailSpotIds[trailId] ?? emptyArray)

export const getTrailStoreActions = () => ({
  setTrails: trailStore.getState().setTrails,
  setStatus: trailStore.getState().setStatus,
  setTrailSpotIds: trailStore.getState().setTrailSpotIds,
  setTrailStats: trailStore.getState().setTrailStats,
})

export const getTrailData = () => ({
  byId: trailStore.getState().byId,
  status: trailStore.getState().status,
  error: trailStore.getState().error,
  updatedAt: trailStore.getState().updatedAt,
})

export const getTrails = () => Object.values(trailStore.getState().byId)
export const getTrailsById = () => trailStore.getState().byId
export const getTrail = (trailId: string) => trailStore.getState().byId[trailId]
export const getTrailSpotIds = () => trailStore.getState().trailSpotIds

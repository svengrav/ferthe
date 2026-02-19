import { Status, StoreActions, StoreState } from '@app/shared/index'
import { Spot, SpotPreview } from '@shared/contracts'
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

/**
 * Converts an array of items with `id` to a Record keyed by id.
 */
const toById = <T extends { id: string }>(items: T[]): Record<string, T> =>
  Object.fromEntries(items.map(item => [item.id, item]))

interface SpotActions extends StoreActions {
  setSpots: (spots: Spot[]) => void
  upsertSpot: (spot: Spot) => void
  setSpotPreviews: (previews: SpotPreview[]) => void
}

interface SpotState extends StoreState {
  status: Status
  byId: Record<string, Spot>
  previewsById: Record<string, SpotPreview>
}

export const spotStore = create<SpotState & SpotActions>(set => ({
  // Metadata
  updatedAt: new Date(0),
  status: 'uninitialized',
  error: undefined,

  // Spot specific data
  byId: {},
  previewsById: {},

  setStatus: status => set({ status }),
  setSpots: spots => set({ byId: toById(spots) }),
  upsertSpot: spot => set(state => ({ byId: { ...state.byId, [spot.id]: spot } })),
  setSpotPreviews: previews => set({ previewsById: toById(previews) }),
}))

export const useSpotStatus = () => spotStore(state => state.status)
export const useSpotStoreData = () => spotStore(state => state)
export const useSpots = () => spotStore(useShallow(state => Object.values(state.byId)))
export const useSpot = (spotId: string) => spotStore(state => state.byId[spotId])
export const useSpotPreview = (spotId: string) => spotStore(state => state.previewsById[spotId])
export const useSpotPreviews = () => spotStore(useShallow(state => Object.values(state.previewsById)))
export const useSpotPreviewsById = () => spotStore(state => state.previewsById)

export const getSpotStoreActions = () => ({
  setSpots: spotStore.getState().setSpots,
  upsertSpot: spotStore.getState().upsertSpot,
  setStatus: spotStore.getState().setStatus,
  setSpotPreviews: spotStore.getState().setSpotPreviews,
})

export const getSpotData = () => ({
  byId: spotStore.getState().byId,
  previewsById: spotStore.getState().previewsById,
  status: spotStore.getState().status,
  error: spotStore.getState().error,
  updatedAt: spotStore.getState().updatedAt,
})

export const getSpots = () => Object.values(spotStore.getState().byId)
export const getSpotsById = () => spotStore.getState().byId
export const getSpot = (spotId: string) => spotStore.getState().byId[spotId]

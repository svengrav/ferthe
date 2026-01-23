import { StoreActions, StoreData } from '@app/shared/index'
import { DiscoveryContent } from '@shared/contracts'
import { create } from 'zustand'

interface DiscoveryContentActions extends StoreActions {
  setContent: (discoveryId: string, content: DiscoveryContent) => void
  clearContent: (discoveryId: string) => void
}

interface DiscoveryContentData extends StoreData {
  contents: Record<string, DiscoveryContent>
}

export const discoveryContentStore = create<DiscoveryContentData & DiscoveryContentActions>(set => ({
  // Metadata
  updatedAt: new Date(0),
  status: 'uninitialized',
  error: undefined,

  contents: {},

  setStatus: status => set({ status }),
  setContent: (discoveryId, content) =>
    set(state => ({
      contents: { ...state.contents, [discoveryId]: content },
    })),
  clearContent: discoveryId =>
    set(state => {
      const { [discoveryId]: _, ...rest } = state.contents
      return { contents: rest }
    }),
}))

// Hooks
export const useDiscoveryContent = (discoveryId: string) =>
  discoveryContentStore(state => state.contents[discoveryId])

// Selectors
export const getDiscoveryContent = (discoveryId: string) =>
  discoveryContentStore.getState().contents[discoveryId]

export const getDiscoveryContentActions = () => ({
  setContent: discoveryContentStore.getState().setContent,
  clearContent: discoveryContentStore.getState().clearContent,
  setStatus: discoveryContentStore.getState().setStatus,
})

import { create } from 'zustand'

type OverlayItem = {
  id: string
  overlay: React.ReactNode
  settings?: OverlayItemSettings
}

type OverlayItemSettings = {
  closeOnBackdropPress?: boolean
  transparent?: boolean
  animationType?: 'slide' | 'fade'
}

type OverlayStore = {
  overlays: OverlayItem[]
  show: (overlay: React.ReactNode, settings?: OverlayItemSettings) => string
  remove: (id: string) => void
  pop: () => void
  clearAll: () => void
}

const generateId = () => Math.random().toString(36).substring(2, 15)

export const useOverlayStore = create<OverlayStore>(set => ({
  overlays: [],
  show: (overlay, settings) => {
    const id = generateId()
    set(state => ({
      overlays: [...state.overlays, { id, overlay, settings: settings || ({} as OverlayItemSettings) }],
    }))
    return id
  },
  remove: id =>
    set(state => ({
      overlays: state.overlays.filter(item => item.id !== id),
    })),
  pop: () => set(state => ({ overlays: state.overlays.slice(0, -1) })),
  clearAll: () => set({ overlays: [] }),
}))

export const setOverlay = (overlay: React.ReactNode, settings?: OverlayItemSettings): (() => void) => {
  const store = useOverlayStore.getState()
  const id = store.show(overlay, settings)

  // Return remove function
  return () => {
    const currentStore = useOverlayStore.getState()
    currentStore.remove(id)
  }
}

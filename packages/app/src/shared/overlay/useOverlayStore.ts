import { create } from 'zustand'

type OverlayItem = {
  id: string
  key: string // Unique key to prevent duplicates
  overlay: React.ReactNode
  settings?: OverlayItemSettings
}

type OverlayItemSettings = {
  closeOnBackdropPress?: boolean
  transparent?: boolean
  animationType?: 'slide' | 'fade'
  title?: string
  variant?: 'compact' | 'fullscreen' | 'page'
  closable?: boolean
  options?: any[]
  scrollable?: boolean
  inset?: 'none' | 'sm' | 'md' | 'lg'
}

type OverlayStore = {
  overlays: OverlayItem[]
  show: (key: string, overlay: React.ReactNode, settings?: OverlayItemSettings) => string
  remove: (id: string) => void
  removeByKey: (key: string) => void
  hasKey: (key: string) => boolean
  pop: () => void
  clearAll: () => void
}

const generateId = () => Math.random().toString(36).substring(2, 15)

export const useOverlayStore = create<OverlayStore>(set => ({
  overlays: [],
  show: (key, overlay, settings) => {
    const id = generateId()
    set(state => {
      // Check if key already exists - if so, don't add duplicate
      if (state.overlays.some(item => item.key === key)) {
        return state
      }
      return {
        overlays: [...state.overlays, { id, key, overlay, settings: settings || ({} as OverlayItemSettings) }],
      }
    })
    return id
  },
  remove: id =>
    set(state => ({
      overlays: state.overlays.filter(item => item.id !== id),
    })),
  removeByKey: key =>
    set(state => ({
      overlays: state.overlays.filter(item => item.key !== key),
    })),
  hasKey: key => {
    const state = useOverlayStore.getState()
    return state.overlays.some(item => item.key === key)
  },
  pop: () => set(state => ({ overlays: state.overlays.slice(0, -1) })),
  clearAll: () => set({ overlays: [] }),
}))

export const setOverlay = (key: string, content: React.ReactNode, options?: OverlayItemSettings): (() => void) => {
  const store = useOverlayStore.getState()
  const id = store.show(key, content, options)

  // Return remove function
  return () => {
    const currentStore = useOverlayStore.getState()
    currentStore.remove(id)
  }
}

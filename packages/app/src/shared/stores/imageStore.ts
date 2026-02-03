import { ImageReference } from '@shared/contracts'
import { create } from 'zustand'

interface ImageCacheEntry {
  imageRef: ImageReference
  timestamp: number
}

interface ImageStoreState {
  cache: Map<string, ImageCacheEntry>
  addToCache: (id: string, imageRef: ImageReference) => void
  getFromCache: (id: string) => ImageReference | undefined
  clearCache: () => void
  isExpired: (id: string, expiryMinutes?: number) => boolean
}

/**
 * Store for caching image URLs with SAS tokens.
 * Prevents unnecessary backend calls and manages token refresh.
 * 
 * Default expiry: 10 minutes (before the 15-minute backend expiry)
 */
export const useImageStore = create<ImageStoreState>((set, get) => ({
  cache: new Map(),

  addToCache: (id: string, imageRef: ImageReference) => {
    set(state => {
      const newCache = new Map(state.cache)
      newCache.set(id, {
        imageRef,
        timestamp: Date.now(),
      })
      return { cache: newCache }
    })
  },

  getFromCache: (id: string) => {
    const entry = get().cache.get(id)
    if (!entry) return undefined

    // Check if expired (default: 10 minutes)
    if (get().isExpired(id)) {
      // Remove expired entry
      set(state => {
        const newCache = new Map(state.cache)
        newCache.delete(id)
        return { cache: newCache }
      })
      return undefined
    }

    return entry.imageRef
  },

  isExpired: (id: string, expiryMinutes = 10) => {
    const entry = get().cache.get(id)
    if (!entry) return true

    const now = Date.now()
    const expiryMs = expiryMinutes * 60 * 1000
    return now - entry.timestamp > expiryMs
  },

  clearCache: () => {
    set({ cache: new Map() })
  },
}))

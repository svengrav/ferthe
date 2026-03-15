import type { AppUpdate } from '@shared/contracts'
import { create } from 'zustand/react'

interface SystemState {
  blockingUpdate: AppUpdate | null
  blockingUpdateOnClose: (() => void) | null
  setBlockingUpdate: (update: AppUpdate, onClose?: () => void) => void
  dismissBlockingUpdate: () => void
}

export const useSystemStore = create<SystemState>(set => ({
  blockingUpdate: null,
  blockingUpdateOnClose: null,
  setBlockingUpdate: (update, onClose) => set({ blockingUpdate: update, blockingUpdateOnClose: onClose ?? null }),
  dismissBlockingUpdate: () => set({ blockingUpdate: null, blockingUpdateOnClose: null }),
}))

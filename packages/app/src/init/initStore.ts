import { create } from "zustand/react"

interface InitState {
  fontsReady: boolean
  backendReady: boolean
  appContextReady: boolean
  sessionReady: boolean
  appReady: boolean
  dataReady: boolean
  pushReady: boolean
  setFontsReady: () => void
  setBackendReady: () => void
  setAppContextReady: () => void
  setSessionReady: () => void
  setAppReady: () => void
  setDataReady: () => void
  setPushReady: () => void
}

export const useInitStore = create<InitState>(set => ({
  fontsReady: false,
  backendReady: false,
  appContextReady: false,
  sessionReady: false,
  appReady: false,
  dataReady: false,
  pushReady: false,
  setFontsReady: () => set({ fontsReady: true }),
  setBackendReady: () => set({ backendReady: true }),
  setAppContextReady: () => set({ appContextReady: true }),
  setSessionReady: () => set({ sessionReady: true }),
  setAppReady: () => set({ appReady: true }),
  setDataReady: () => set({ dataReady: true }),
  setPushReady: () => set({ pushReady: true }),
}))

import type { APIContext } from '@app/api'
import type { AppContext } from '@app/appContext'
import { create } from 'zustand'

/**
 * Zustand store for the AppContext.
 *
 * Replacement for getAppContextStore() in components/hooks.
 * Does NOT import appContext.ts at module level → breaks require cycles.
 *
 * Usage:
 *   const { spotApplication } = useAppContext()
 *   const spotApplication = getAppContextStore().spotApplication
 *
 * Initialization (once, in App.tsx):
 *   useAppContextStore.getState().setContext(createdAppContext)
 */

interface AppContextStore {
  context: AppContext | null
  api: APIContext | null
  setContext: (context: AppContext) => void
  setApi: (api: APIContext) => void
}

export const useAppContextStore = create<AppContextStore>(set => ({
  context: null,
  api: null,
  setContext: context => set({ context }),
  setApi: api => set({ api }),
}))

/**
 * Hook: access the full AppContext (throws if not yet initialized).
 */
export const useAppContext = (): AppContext => {
  const context = useAppContextStore(s => s.context)
  if (!context) throw new Error('AppContext not initialized. Call setContext() first.')
  return context
}

/**
 * Getter for use outside of React (services, hooks without render context).
 * Equivalent to the old getAppContextStore().
 */
export const getAppContextStore = (): AppContext => {
  const { context } = useAppContextStore.getState()
  if (!context) throw new Error('AppContext not initialized. Call setContext() first.')
  return context
}

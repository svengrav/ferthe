import { createContext, useContext } from 'react'

interface PageTabsContextValue {
  activeTab: string
  setActiveTab: (id: string) => void
}

export const PageTabsContext = createContext<PageTabsContextValue | null>(null)

export function usePageTabsContext() {
  const context = useContext(PageTabsContext)
  if (!context) {
    throw new Error('PageTab must be used within PageTabs')
  }
  return context
}

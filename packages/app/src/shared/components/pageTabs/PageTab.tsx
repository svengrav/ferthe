import { ReactNode } from 'react'
import { usePageTabsContext } from './PageTabsContext'

interface PageTabProps {
  id: string
  label: string
  children: ReactNode
}

/**
 * Individual tab content wrapper. Must be used within PageTabs.
 * Only renders children when this tab is active.
 */
function PageTab({ id, children }: PageTabProps) {
  const { activeTab } = usePageTabsContext()

  if (activeTab !== id) return null

  return <>{children}</>
}

export default PageTab

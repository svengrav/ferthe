import { ReactNode } from 'react'
import { ScrollView } from 'react-native'
import { usePageTabsContext } from './PageTabsContext'

interface PageTabProps {
  id: string
  label: string
  children: ReactNode
}

/**
 * Individual tab content wrapper. Must be used within PageTabs.
 * Only renders children when this tab is active.
 * Wraps content in ScrollView for scrollable content.
 */
function PageTab({ id, children }: PageTabProps) {
  const { activeTab } = usePageTabsContext()

  if (activeTab !== id) return null

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      {children}
    </ScrollView>
  )
}

export default PageTab

import { Theme, useThemeStore } from '@app/shared/theme'
import { ReactElement, ReactNode, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import Text from '../text/Text'
import { PageTabsContext } from './PageTabsContext'

interface PageTabChild {
  id: string
  label: string
}

interface PageTabsProps {
  children: ReactNode
  defaultTab?: string
  variant?: 'tabs' | 'chips'
}

/**
 * Container for tab-based navigation within a page or overlay.
 * Manages active tab state and renders tab headers.
 * 
 * Usage:
 * ```tsx
 * <PageTabs>
 *   <PageTab id="details" label="Details">
 *     <DetailsView />
 *   </PageTab>
 *   <PageTab id="activity" label="Activity">
 *     <ActivityView />
 *   </PageTab>
 * </PageTabs>
 * ```
 */
function PageTabs({ children, defaultTab, variant = 'tabs' }: PageTabsProps) {
  const theme = useThemeStore()
  const styles = createStyles(theme, variant)

  // Extract tab metadata from children
  const tabs = extractTabs(children)
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '')

  return (
    <PageTabsContext.Provider value={{ activeTab, setActiveTab }}>
      <View style={styles.container}>
        {/* Tab Header */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.tabBar}
        >
          {tabs.map((tab) => (
            <Pressable
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.tabActive,
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab.id && styles.tabTextActive,
              ]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Tab Content */}
        <View style={styles.content}>{children}</View>
      </View>
    </PageTabsContext.Provider>
  )
}

export default PageTabs

// Extract tab metadata from PageTab children
function extractTabs(children: ReactNode): PageTabChild[] {
  const tabs: PageTabChild[] = []

  const childrenArray = Array.isArray(children) ? children : [children]

  childrenArray.forEach((child) => {
    if (child && typeof child === 'object' && 'props' in child) {
      const element = child as ReactElement<{ id: string; label: string }>
      if (element.props.id && element.props.label) {
        tabs.push({
          id: element.props.id,
          label: element.props.label,
        })
      }
    }
  })

  return tabs
}

const createStyles = (theme: Theme, variant: 'tabs' | 'chips') => {
  const isChips = variant === 'chips'

  return StyleSheet.create({
    container: {},
    scrollView: {
      flexGrow: 0,
      flexShrink: 0,
    },
    tabBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: isChips ? 8 : 0,
      paddingVertical: theme.tokens.inset.sm,
      borderBottomWidth: isChips ? 0 : 1,
      borderBottomColor: theme.colors.divider,
    },
    tab: {
      paddingVertical: isChips ? 4 : 12,
      paddingHorizontal: isChips ? 8 : 20,
      borderRadius: isChips ? 16 : 0,
      backgroundColor: isChips ? theme.colors.surface : 'transparent',
      borderBottomWidth: isChips ? 0 : 2,
      borderBottomColor: 'transparent',
    },
    tabActive: {
      backgroundColor: isChips ? theme.colors.onSurface : 'transparent',
      borderBottomColor: isChips ? 'transparent' : theme.colors.onSurface,
    },
    tabText: {
      fontSize: 14,
      color: theme.colors.onSurface,
    },
    tabTextActive: {
      color: isChips ? theme.colors.surface : theme.colors.onSurface,
      fontWeight: isChips ? '400' : '600',
    },
    content: {
      flex: 1,
    },
  })
}

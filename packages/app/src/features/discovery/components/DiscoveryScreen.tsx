import { getAppContext } from '@app/appContext'
import { Page, Text } from '@app/shared/components'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { useEffect } from 'react'
import { useDiscoveryData, useDiscoveryStatus } from '../stores/discoveryStore'
import { DiscoveryCardList } from './DiscoveryCardList'

// Status constants
const STATUS_UNINITIALIZED = 'uninitialized'
const STATUS_ERROR = 'error'
const STATUS_LOADING = 'loading'

/**
 * Hook to manage discovery screen state and data fetching
 */
const useDiscoveryScreen = () => {
  const { discoveries, spots } = useDiscoveryData()
  const discoveryStatus = useDiscoveryStatus()
  const { requestDiscoveryState, getDiscoveryCards } = getAppContext().discoveryApplication

  // Initialize discovery data if needed
  useEffect(() => {
    if (discoveryStatus === STATUS_UNINITIALIZED || discoveryStatus === STATUS_ERROR) {
      requestDiscoveryState()
    }
  }, [discoveryStatus, requestDiscoveryState])

  const isLoading = discoveryStatus === STATUS_LOADING
  const cards = getDiscoveryCards()

  return {
    discoveries,
    spots,
    cards,
    isLoading,
    requestDiscoveryState,
  }
}

/**
 * Discovery screen component that displays a list of discovery cards with refresh functionality
 */
function DiscoveryScreen() {
  const { styles, theme } = useApp(useStyles)
  const {
    cards,
    isLoading,
    requestDiscoveryState,
  } = useDiscoveryScreen()

  if (!styles) return null

  return (
    <Page >
      <Text style={theme.layout.header}>Discoveries</Text>

      <DiscoveryCardList
        cards={cards}
        refreshing={isLoading}
        onRefresh={requestDiscoveryState}
      />
    </Page>
  )
}

const useStyles = createThemedStyles(theme => ({
  // Placeholder styles, replace with actual styles
}))

export default DiscoveryScreen

import { useEffect } from 'react'

import { getAppContext } from '@app/appContext'
import { Page } from '@app/shared/components'
import Header from '@app/shared/components/header/Header'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'

import { SpotCardList } from '@app/features/spot/components/index.ts'
import { useSettingsPage } from '../../settings/components/SettingsPage'
import { useDiscoveryData, useDiscoveryStatus } from '../stores/discoveryStore'
import { useDiscoveryCardPage } from './DiscoveryCardPage.tsx'

// Status constants
const STATUS_UNINITIALIZED = 'uninitialized'
const STATUS_ERROR = 'error'
const STATUS_LOADING = 'loading'

/**
 * Hook to manage discovery screen state and data fetching
 */
const useDiscoveryScreen = () => {
  const { discoveries } = useDiscoveryData()
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
    cards,
    isLoading,
    requestDiscoveryState,
  }
}

/**
 * Discovery screen component that displays a list of discovery cards with refresh functionality.
 * Supports deep-linking to specific discovery cards via route parameters.
 */
function DiscoveryScreen() {
  const { t } = useLocalizationStore()
  const { showSettings } = useSettingsPage()
  const { showDiscoveryCardDetails } = useDiscoveryCardPage()

  const {
    cards,
    isLoading,
    requestDiscoveryState,
  } = useDiscoveryScreen()

  return (
    <Page options={[{ label: t.navigation.settings, onPress: showSettings }]}>
      <Header title={t.discovery.discoveries} />

      <SpotCardList
        items={cards.map(c => ({
          id: c.spotId,
          image: c.image,
          title: c.title,
          discovered: true,
        }))}
        onPress={(item) => {
          const card = cards.find(c => c.spotId === item.id)
          if (card) showDiscoveryCardDetails(card)
        }}
        refreshing={isLoading}
        onRefresh={requestDiscoveryState}
      />
    </Page>
  )
}

export default DiscoveryScreen

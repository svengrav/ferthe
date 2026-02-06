import { useEffect } from 'react'

import { getAppContext } from '@app/appContext'
import { Page } from '@app/shared/components'
import Header from '@app/shared/components/header/Header'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { setOverlay } from '@app/shared/overlay'
import { useApp } from '@app/shared/useApp'

import { SettingsForm } from '../../settings/components/SettingsForm'
import { DiscoveryCardState } from '../logic/types'
import { useDiscoveryData, useDiscoveryStatus } from '../stores/discoveryStore'
import DiscoveryCardDetails from './DiscoveryCardDetails'
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
 * Discovery screen component that displays a list of discovery cards with refresh functionality.
 * Supports deep-linking to specific discovery cards via route parameters.
 */
function DiscoveryScreen() {
  const { locales } = useApp()
  const { t } = useLocalizationStore()

  const {
    cards,
    isLoading,
    requestDiscoveryState,
  } = useDiscoveryScreen()

  // Open discovery card details in overlay
  const openCardDetails = (card: DiscoveryCardState) => {
    const close = setOverlay(
      'discoveryCardDetails_' + card.discoveryId,
      <DiscoveryCardDetails card={card} onClose={() => close()} />,
      { variant: 'fullscreen', transparent: true, closable: true }
    )
  }

  // Open settings form in overlay
  const openSettings = () => {
    const close = setOverlay(
      'settingsForm',
      <SettingsForm
        onClose={() => close()}
        onSubmit={() => close()}
      />
    )
  }

  return (
    <Page options={[{ label: t.navigation.settings, onPress: openSettings }]}>
      <Header title={t.discovery.discoveries} />

      <DiscoveryCardList
        cards={cards}
        refreshing={isLoading}
        onRefresh={requestDiscoveryState}
        onTap={openCardDetails}
      />
    </Page>
  )
}

export default DiscoveryScreen

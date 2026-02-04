import { getAppContext } from '@app/appContext'
import { Page, Text } from '@app/shared/components'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { setOverlay } from '@app/shared/overlay'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { useEffect } from 'react'
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
  const { styles, theme } = useApp(useStyles)
  const { t } = useLocalizationStore()

  // Helper to open discovery card details
  function openCardDetails(card: DiscoveryCardState) {
    const close = setOverlay('discoveryCardDetails_' + card.discoveryId,
      <DiscoveryCardDetails card={card} onClose={() => close()} />,
      { variant: 'fullscreen', transparent: true, closable: true }
    )
  }


  const {
    cards,
    isLoading,
    requestDiscoveryState,
  } = useDiscoveryScreen()

  if (!styles) return null

  return (
    <Page options={[{ label: t.navigation.settings, onPress: () => setOverlay('settingsForm', <SettingsForm onClose={() => { }} onSubmit={() => { }} />) }]}>
      <Text variant='heading'>Discoveries</Text>

      <DiscoveryCardList
        cards={cards}
        refreshing={isLoading}
        onRefresh={requestDiscoveryState}
        onTap={openCardDetails}
      />
    </Page>
  )
}

const useStyles = createThemedStyles(theme => ({
  // Placeholder styles, replace with actual styles
}))

export default DiscoveryScreen

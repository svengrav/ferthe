import { getAppContext } from '@app/appContext'
import { useDiscoveryStatus } from '@app/features/discovery/stores/discoveryStore'
import { useSettingsPage } from '@app/features/settings/components/SettingsPage'
import { Page } from '@app/shared/components'
import Header from '@app/shared/components/header/Header'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { useMemo } from 'react'
import { useSpots } from '../stores/spotStore'
import SpotCardList from './SpotCardList'
import { useSpotPage } from './SpotPage'

/**
 * Spot screen component that displays latest discovered spots.
 * Shows spots sorted by discovery date (newest first).
 * Uses userStatus from API to filter discovered spots.
 */
function SpotScreen() {
  const { t } = useLocalizationStore()
  const { showSettings } = useSettingsPage()
  const { showSpotPage } = useSpotPage()

  const spots = useSpots()
  const status = useDiscoveryStatus()
  const { discoveryApplication } = getAppContext()

  // Filter and map discovered spots
  const spotItems = useMemo(() => {
    return spots
      .filter(spot => spot.source === 'discovery' || (spot.source === undefined && spot.image))
      .map(spot => ({
        id: spot.id,
        image: spot.image,
        blurredImage: spot.blurredImage,
        title: spot.name,
        discovered: true,
      }))
    // Note: Discovery date sorting removed as Spot doesn't have discoveredAt
    // If needed, can be added back when API includes discovery metadata
  }, [spots])

  const handleRefresh = () => {
    discoveryApplication.requestDiscoveryState()
  }

  const handleSpotPress = (item: { id: string }) => {
    showSpotPage(item.id)
  }

  const isRefreshing = status === 'loading'

  return (
    <Page options={[{ label: t.navigation.settings, onPress: showSettings }]}>
      <Header title={t.navigation.feed} />

      <SpotCardList
        items={spotItems}
        onPress={handleSpotPress}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
      />
    </Page>
  )
}

export default SpotScreen

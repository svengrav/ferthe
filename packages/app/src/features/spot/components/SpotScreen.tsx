import { getAppContext } from '@app/appContext'
import { useDiscoveryStatus } from '@app/features/discovery/stores/discoveryStore'
import { useSettingsPage } from '@app/features/settings/components/SettingsPage'
import { Button, Page, Text } from '@app/shared/components'
import Header from '@app/shared/components/header/Header'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { Theme, useTheme } from '@app/shared/theme'
import { useMemo } from 'react'
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { useCreateSpotPage } from '../creation/components/SpotFormPage'
import { useSpots } from '../stores/spotStore'
import SpotCardList from './SpotCardList'
import { useSpotPage } from './SpotPage'

/**
 * Spot screen component that displays latest discovered spots.
 * Shows two sections: "My Spots" (created) and "Discoveries".
 */
function SpotScreen() {
  const { t } = useLocalizationStore()
  const { styles } = useTheme(createStyles)
  const { showSettings } = useSettingsPage()
  const { showSpotPage } = useSpotPage()
  const { showCreateSpotPage } = useCreateSpotPage()

  const spots = useSpots()
  const status = useDiscoveryStatus()
  const { discoveryApplication } = getAppContext()

  const toItem = (spot: typeof spots[number]) => ({
    id: spot.id,
    image: spot.image,
    blurredImage: spot.blurredImage,
    title: spot.name,
    isLocked: false,
  })

  const mySpots = useMemo(() => spots.filter(s => s.source === 'created').map(toItem), [spots])
  const discoveredSpots = useMemo(() => spots.filter(s => s.source === 'discovery').map(toItem), [spots])

  const handleRefresh = () => discoveryApplication.requestDiscoveryState()
  const handleSpotPress = (item: { id: string }) => showSpotPage(item.id)
  const isRefreshing = status === 'loading'

  return (
    <Page options={[{ label: t.navigation.settings, onPress: showSettings }]}>
      <Header
        title={t.navigation.feed}
        trailing={<Button icon="add" onPress={showCreateSpotPage} />}
      />
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        {mySpots.length > 0 && (
          <View style={styles.section}>
            <Text variant="section" style={styles.sectionTitle}>{t.spotCreation.mySpots}</Text>
            <SpotCardList
              items={mySpots}
              onPress={handleSpotPress}
              horizontal
            />
          </View>
        )}
        {discoveredSpots.length > 0 && (
          <View style={styles.section}>
            <Text variant="section" style={styles.sectionTitle}>{t.discovery.discoveries}</Text>
            <SpotCardList
              items={discoveredSpots}
              onPress={handleSpotPress}
              scrollEnabled={false}
              style={styles.grid}
            />
          </View>
        )}
      </ScrollView>
    </Page>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  scrollContent: {
    gap: theme.tokens.spacing.lg,
    paddingBottom: theme.tokens.spacing.lg,
  },
  section: {
    gap: theme.tokens.spacing.sm,
  },
  sectionTitle: {
    paddingHorizontal: theme.tokens.spacing.xs,
  },
  grid: {
    flex: 0,
  },
})

export default SpotScreen

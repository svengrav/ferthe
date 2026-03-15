import { useSettingsPage } from '@app/features/settings/components/SettingsPage'
import { Button, Page, Spacer, Stack, Text } from '@app/shared/components'
import Header from '@app/shared/components/header/Header'
import { useLocalization } from '@app/shared/localization'
import { Theme, useTheme } from '@app/shared/theme'
import { StyleSheet } from 'react-native'
import { useCreateSpotPage } from '../creation/components/SpotCreationPage.tsx'
import { useSpotScreen } from '../hooks/useSpotScreenViewModel'
import SpotCardList from './SpotCardList'
import { useSpotPage } from './SpotPage'

/**
 * Spot screen component that displays latest discovered spots.
 * Shows two sections: "My Spots" (created) and "Discoveries".
 */
function SpotScreen() {
  const { locales } = useLocalization()
  const { styles } = useTheme(createStyles)
  const { showSettings } = useSettingsPage()
  const { showSpotPage } = useSpotPage()
  const { showCreateSpotPage } = useCreateSpotPage()

  const { mySpots, discoveredSpots, isLoading, refresh, myLoadMore, myLoadingMore, loadMore, loadingMore } = useSpotScreen()

  const handleSpotPress = (item: { id: string }) => showSpotPage(item.id)

  return (
    <Page
      screen
      scrollable
      onRefresh={refresh}
      refreshing={isLoading}
      onEndReached={loadMore}
      options={[{ label: locales.navigation.settings, onPress: showSettings }]}
    >
      <Header
        title={locales.navigation.feed}
        trailing={<Button icon="add" onPress={showCreateSpotPage} />}
      />

      <Stack testID="my-spots" spacing='lg' >
        <Stack spacing='xs'>
          <Text variant="title" style={styles.sectionTitle}>{locales.spotCreation.yourSpots}</Text>
          <Text variant="subtitle" style={styles.sectionTitle}>{locales.spotCreation.yourSpotsSubtitle}</Text>
        </Stack>
        <SpotCardList
          items={mySpots}
          onPress={handleSpotPress}
          emptyLabel={locales.spotCreation.noSpots}
          onEndReached={myLoadMore}
          loadingMore={myLoadingMore}
          horizontal
        />
      </Stack>
      <Spacer size="xl" />
      <Stack testID="my-discoveries" spacing='lg'>
        <Stack spacing='xs'>
          <Text variant="title" style={styles.sectionTitle}>{locales.discovery.discoveries}</Text>
          <Text variant="subtitle" style={styles.sectionTitle}>{locales.discovery.discoveriesSubtitle}</Text>
        </Stack>

        <SpotCardList
          items={discoveredSpots}
          onPress={handleSpotPress}
          emptyLabel={locales.discovery.noDiscoveries}
          loadingMore={loadingMore}
          scrollEnabled={false}
          style={styles.grid}
        />
      </Stack>
    </Page>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  sectionTitle: {
    paddingHorizontal: theme.tokens.spacing.xs,
  },
  grid: {
    flex: 0,
  },
})

export default SpotScreen

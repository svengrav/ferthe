import { useSettingsPage } from '@app/features/settings/components/SettingsPage'
import { Button, Page, Text } from '@app/shared/components'
import Header from '@app/shared/components/header/Header'
import { useLocalization } from '@app/shared/localization'
import { Theme, useTheme } from '@app/shared/theme'
import { StyleSheet, View } from 'react-native'
import { useCreateSpotPage } from '../creation/components/SpotCreationPage.tsx'
import { useSpotScreenViewModel } from '../hooks/useSpotScreenViewModel'
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

  const { mySpots, discoveredSpots, isLoading, refresh } = useSpotScreenViewModel()

  const handleSpotPress = (item: { id: string }) => showSpotPage(item.id)

  return (
    <Page
      scrollable
      options={[{ label: locales.navigation.settings, onPress: showSettings }]}
    >
      <Header
        title={locales.navigation.feed}
        trailing={<Button icon="add" onPress={showCreateSpotPage} />}
      />
      {mySpots.length > 0 && (
        <View style={styles.section} id="my-spots">
          <Text variant="section" style={styles.sectionTitle}>{locales.spotCreation.mySpots}</Text>
          <SpotCardList
            items={mySpots}
            onPress={handleSpotPress}
            horizontal
          />
        </View>
      )}
      {discoveredSpots.length > 0 && (
        <View style={styles.section} id="my-discoveries">
          <Text variant="section" style={styles.sectionTitle}>{locales.discovery.discoveries}</Text>
          <SpotCardList
            items={discoveredSpots}
            onPress={handleSpotPress}
            scrollEnabled={false}
            style={styles.grid}
          />
        </View>
      )}
    </Page>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
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

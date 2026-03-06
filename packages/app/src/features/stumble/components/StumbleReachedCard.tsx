import { Button, Text } from '@app/shared/components'
import { SpotContainer, SpotGradientFrame, useSpotCardDimensions } from '@app/features/spot/components'
import { useCreateSpotPage } from '@app/features/spot/creation/components/SpotCreationPage'
import { useLocalization } from '@app/shared/localization'
import { closeOverlay, setOverlay } from '@app/shared/overlay'
import { getAppContextStore } from '@app/shared/stores/appContextStore'
import { Theme, useTheme } from '@app/shared/theme'
import { StumbleSuggestion } from '@shared/contracts'
import { StyleSheet, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'

const OVERLAY_KEY = 'stumble-reached-card'

export function useStumbleReachedCard() {
  return {
    showStumbleReachedCard: (suggestion: StumbleSuggestion) =>
      setOverlay(
        OVERLAY_KEY,
        <View style={overlayContainerStyle}>
          <StumbleReachedCard suggestion={suggestion} onClose={() => closeOverlay(OVERLAY_KEY)} />
        </View>
      ),
    closeStumbleReachedCard: () => closeOverlay(OVERLAY_KEY),
  }
}

interface Props {
  suggestion: StumbleSuggestion
  onClose: () => void
}

function StumbleReachedCard({ suggestion, onClose }: Props) {
  const { width, height, padding } = useSpotCardDimensions({ variant: 'card' })
  const { styles } = useTheme(createStyles)
  const { locales } = useLocalization()
  const { showCreateSpotPage } = useCreateSpotPage()
  const { stumbleApplication } = getAppContextStore()

  const handleCreateSpot = () => {
    onClose()
    stumbleApplication.recordVisit(suggestion.id)
    showCreateSpotPage(suggestion.location)
  }

  return (
    <SpotContainer width={width} height={height} withShadow>
      <SpotGradientFrame padding={padding}>
        <View style={styles.content}>

          {/* Close button */}
          <View style={styles.closeButton}>
            <Button icon='close' variant='secondary' onPress={onClose} />
          </View>

          {/* POI details + actions */}
          <ScrollView style={styles.scroll}>
            <Text variant='heading'>{suggestion.name}</Text>
            {suggestion.address && (
              <Text variant='caption' style={styles.address}>{suggestion.address}</Text>
            )}
            {suggestion.tags && suggestion.tags.length > 0 && (
              <Text variant='caption' style={styles.tags}>{suggestion.tags.join(' · ')}</Text>
            )}
            <View style={styles.actions}>
              <Button label={locales.stumble.createSpot} variant='primary' onPress={handleCreateSpot} />
            </View>
          </ScrollView>

        </View>
      </SpotGradientFrame>
    </SpotContainer>
  )
}

const overlayContainerStyle = StyleSheet.create({
  container: { zIndex: 100, alignItems: 'center', height: '100%', justifyContent: 'center', flex: 1 },
}).container

const createStyles = (_theme: Theme) => StyleSheet.create({
  content: {
    padding: 24,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 4,
  },
  scroll: {
    width: '100%',
    flexGrow: 0,
    alignSelf: 'center',
    paddingBottom: 80,
    paddingHorizontal: 20,
    gap: 8,
  },
  address: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  tags: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  actions: {
    gap: 8,
  },
})


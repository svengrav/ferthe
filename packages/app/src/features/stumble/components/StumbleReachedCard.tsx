import { Button, Stack, Text } from '@app/shared/components'
import { SpotContainer, SpotGradientFrame, useSpotCardDimensions } from '@app/features/spot/components'
import { SpotCircleIcon } from './SpotCircleIcon'
import { useCreateSpotPage } from '@app/features/spot/creation/components/SpotCreationPage'
import { useLocalization } from '@app/shared/localization'
import { closeOverlay, setOverlay } from '@app/shared/overlay'
import { getAppContextStore } from '@app/shared/stores/appContextStore'
import { useDiscoveryTrailId } from '@app/features/discovery/stores/discoveryTrailStore'
import { Theme, useTheme } from '@app/shared/theme'
import { StumbleSuggestionResult } from '@shared/contracts'
import { StyleSheet, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'

const OVERLAY_KEY = 'stumble-reached-card'

export function useStumbleReachedCard() {
  return {
    showStumbleReachedCard: (suggestion: StumbleSuggestionResult) =>
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
  suggestion: StumbleSuggestionResult
  onClose: () => void
}

function StumbleReachedCard({ suggestion, onClose }: Props) {
  const { width, height, padding } = useSpotCardDimensions({ variant: 'card' })
  const { styles, theme } = useTheme(createStyles)
  const { locales } = useLocalization()
  const { showCreateSpotPage } = useCreateSpotPage()
  const { stumbleApplication } = getAppContextStore()
  const trailId = useDiscoveryTrailId()

  const handleCreateSpot = () => {
    onClose()
    showCreateSpotPage(suggestion.location, {
      initialTrailIds: trailId ? [trailId] : [],
      onSpotCreated: (spot) => stumbleApplication.recordVisit(suggestion.id, spot.id),
    })
  }

  return (
    <SpotContainer width={width} height={height} withShadow>
      <SpotGradientFrame padding={4} colors={[theme.colors.surface, theme.colors.surface]}>
        <Stack spacing='lg' style={styles.content}>
          {/* Close button */}
          <View style={styles.closeButton}>
            <Button icon='close' variant='secondary' onPress={onClose} />
          </View>

          <SpotCircleIcon size={200} />

          {/* POI details + actions */}
          <ScrollView style={styles.scroll}>
            <Text variant='heading'>{suggestion.name}</Text>
            <Text variant='caption' style={styles.category}>{locales.stumble.categories[suggestion.category]}</Text>
            {suggestion.address && (
              <Text variant='caption' style={styles.address}>{suggestion.address}</Text>
            )}
            {suggestion.tags && suggestion.tags.length > 0 && (
              <Text variant='caption' style={styles.tags}>{suggestion.tags.join(' · ')}</Text>
            )}
            {suggestion.description && (
              <Text variant='body' style={styles.description}>{suggestion.description}</Text>
            )}

          </ScrollView>
          <View style={styles.actions}>
            <Button label={locales.stumble.createSpot} variant='primary' onPress={handleCreateSpot} />
          </View>
        </Stack>
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

    alignSelf: 'center',
    paddingBottom: 80,
    paddingHorizontal: 20,
    gap: 8,
  },
  address: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  category: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  tags: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  description: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 8,
  },
  actions: {
    alignItems: 'center',
    gap: 8,
  },
})


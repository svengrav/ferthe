import { StyleSheet } from 'react-native'

import { Button, Page, PageTab, PageTabs, Stack, Text } from '@app/shared/components'
import { closeOverlay, setOverlay } from '@app/shared/overlay'
import { Theme, useTheme } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'

import { DiscoveryStats, DiscoveryUserContentSection } from '@app/features/discovery'
import SpotRating from '@app/features/discovery/components/SpotRating'
import { useSpotWithDiscovery } from '../hooks/useSpotWithDiscovery'
import SpotCard from './card/SpotCard'
import { useSpotCardDimensions } from './card/useSpotCardDimensions'
import { SpotLocation } from './SpotLocation'
import SpotStatus from './SpotStatus'

export const useSpotPage = () => ({
  showSpotPage: (spotId: string) => {
    const overlayId = `spot-page-${spotId}`
    return setOverlay(
      overlayId,
      <SpotPage spotId={spotId} onClose={() => closeOverlay(overlayId)} />,
    )
  },
  closeSpotPage: (spotId: string) => closeOverlay(`spot-page-${spotId}`),
})

interface SpotPageProps {
  onClose?: () => void
  spotId: string
}

/**
 * Displays comprehensive information about a spot including name, image, description, and location.
 * Loads spot data from store or fetches it if not available.
 */
function SpotPage(props: SpotPageProps) {
  const { spotId, onClose } = props
  const { styles } = useTheme(createStyles)
  const { locales } = useApp()
  const { width, height } = useSpotCardDimensions()
  const { spot, discovery, isLoading } = useSpotWithDiscovery(spotId)

  return (
    <Page
      style={styles.container}
      title={spot?.name}
      leading={<Button icon="arrow-back" variant='outlined' onPress={onClose} />}
      loading={isLoading}
    >
      {spot && (
        <PageTabs variant="chips" defaultTab="overview">
          <PageTab id="overview" label={locales.trails.overview}>
            <Stack spacing='md'>
              <SpotCard
                width={width}
                height={height}
                image={spot.image}
                blurredImage={spot.blurredImage}
                title={spot.name}
              />

              <Text variant='section'>{locales.common.status || 'Status'}</Text>
              <SpotStatus spot={spot} discovery={discovery} />

              <SpotRating spotId={spotId} />
              <Text variant="section">Location</Text>
              <SpotLocation location={spot.location} />

              <Text variant='body'>{spot.description}</Text>
              <Text variant="caption">{spot.createdAt.toDateString()}</Text>

              {discovery && <DiscoveryUserContentSection id={discovery.id} />}

            </Stack>
          </PageTab>
          <PageTab id="stats" label={locales.trails.stats.name}>
            {discovery && <DiscoveryStats discoveryId={discovery?.id} />}
          </PageTab>
        </PageTabs>
      )}
    </Page>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    gap: theme.tokens.spacing.sm,
  },
  image: {
    borderRadius: theme.tokens.borderRadius.md,
  },
})

export default SpotPage

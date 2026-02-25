import { StyleSheet, useWindowDimensions } from 'react-native'

import { Button, Image, LocationChip, Page, PageTab, PageTabs, Stack, Text } from '@app/shared/components'
import { closeOverlay, setOverlay } from '@app/shared/overlay'
import { Theme, useTheme } from '@app/shared/theme'

import { useExternalMap } from '@app/shared/hooks'
import { useLocalization } from '@app/shared/localization'
import { getAppContextStore } from '@app/shared/stores/appContextStore'
import { Trail } from '@shared/contracts'
import { useEffect } from 'react'
import { useTrailSpotsViewModel } from '../hooks/useTrailSpotsViewModel'
import { getTrailCenter } from '../services/trailService'
import TrailMetaCard from './TrailMetaCard'
import TrailSpots from './TrailSpots'
import TrailStats from './TrailStats'

export const useTrailPage = () => ({
  showTrailPage: (trail: Trail) => {
    const overlayId = 'trail-page-' + trail.id
    return setOverlay(
      overlayId,
      <TrailPage trail={trail} onClose={() => closeOverlay(overlayId)} />,
    )
  },
  closeTrailPage: (trailId: string) => closeOverlay('trail-page-' + trailId),
})

interface TrailPageProps {
  onClose?: () => void
  trail: Trail
}

/**
 * Displays comprehensive information about a trail including name, image, and description.
 */
function TrailPage(props: TrailPageProps) {
  const { trail, onClose } = props
  const { styles, theme } = useTheme(createStyles)
  const { locales } = useLocalization()
  const { trailApplication } = getAppContextStore()
  const { width: screenWidth } = useWindowDimensions()

  // Load trail spots view model
  const trailSpots = useTrailSpotsViewModel(trail.id)
  const { openMap } = useExternalMap()

  // Calculate image size - square format that fills screen width minus page padding
  const pageInset = theme.tokens.inset.md
  const imageSize = screenWidth - (pageInset * 2)

  // Request trail spot previews on mount or trail change
  useEffect(() => {
    trailApplication.requestTrailSpotPreviews(trail.id)
    trailApplication.getTrailRatingSummary(trail.id)
  }, [trail.id])

  return (
    <Page
      style={styles.container}
      title={trail.name}
      leading={<Button icon="arrow-back" variant='outlined' onPress={onClose} />}
    >
      <PageTabs variant="chips" defaultTab="overview">
        <PageTab id="overview" label={locales.trails.overview}>
          <Stack spacing='md'>
            <Image
              style={styles.image}
              source={trail.image}
              height={imageSize}
              width={imageSize}
              resizeMode="cover"
              placeholder={<Text style={{ color: theme.colors.onPrimary }}>Trail Image</Text>}
            />
            <TrailMetaCard trailId={trail.id} createdAt={trail.createdAt} createdBy={trail.createdBy} />
            <LocationChip location={getTrailCenter(trail)} style={{ alignSelf: 'center' }} onPress={() => { const center = getTrailCenter(trail); if (center) openMap(center) }} />
            <Text variant="section">{locales.trails.description}</Text>
            <Text variant="body">{trail.description}</Text>
          </Stack>
        </PageTab>
        <PageTab id="spots" label={locales.trails.spots}>
          <TrailSpots spots={trailSpots} />
        </PageTab>
        <PageTab id="stats" label={locales.trails.stats.name}>
          <TrailStats trailId={trail.id} />
        </PageTab>
      </PageTabs>
    </Page>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    gap: theme.tokens.spacing.sm,
  },
  image: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.tokens.borderRadius.md,
  },
})

export default TrailPage

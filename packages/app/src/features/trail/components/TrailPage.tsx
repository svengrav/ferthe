import { StyleSheet, useWindowDimensions } from 'react-native'

import { Button, Image, LocationChip, Page, PageTab, PageTabs, SectionHeader, Spacer, Stack, Text } from '@app/shared/components'
import { closeOverlay, setOverlay } from '@app/shared/overlay'
import { Theme, useTheme } from '@app/shared/theme'

import { useExternalMap } from '@app/shared/hooks'
import { useLocalization } from '@app/shared/localization'
import { getAppContextStore } from '@app/shared/stores/appContextStore'
import { Trail } from '@shared/contracts'
import { useEffect, useState } from 'react'
import { useTrailSpotsViewModel } from '../hooks/useTrailSpotsViewModel'
import { getTrailCenter } from '../services/trailService'
import TrailMetaCard from './TrailMetaCard'
import TrailSpots from './TrailSpots'
import TrailStats from './TrailStats'
import { TrailAvatar } from './TrailAvatar'
import TrailStories from '@app/features/trail/components/TrailStories'
import StoryUserContentSection from '@app/features/story/components/StoryUserContentSection'

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
  const { trailApplication, storyApplication } = getAppContextStore()
  const { width: screenWidth } = useWindowDimensions()

  // Load trail spots view model
  const trailSpots = useTrailSpotsViewModel(trail.id)
  const [storiesRefreshKey, setStoriesRefreshKey] = useState(0)
  const { openMap } = useExternalMap(getTrailCenter(trail))

  // Calculate image size - square format that fills screen width minus page padding
  const pageInset = theme.tokens.inset.md
  const imageSize = screenWidth - (pageInset * 2)

  // Request trail spot previews on mount or trail change
  useEffect(() => {
    trailApplication.requestTrailSpotPreviews(trail.id)
    trailApplication.getTrailRatingSummary(trail.id)
    storyApplication.getTrailStory(trail.id)
  }, [trail.id])

  return (
    <Page
      style={styles.container}
      title={trail.name}
      leading={<Button icon="arrow-back" variant='outlined' onPress={onClose} />}
    >
      <PageTabs variant="chips" defaultTab="overview">
        <PageTab id="overview" label={locales.trails.overview}>
          <Stack spacing='lg'>
            <TrailAvatar source={trail.image} label={trail.name} size={imageSize} />
            <TrailMetaCard trailId={trail.id} createdAt={trail.createdAt} createdBy={trail.createdBy} />
            <LocationChip location={getTrailCenter(trail)} style={{ alignSelf: 'center' }} onPress={() => { const center = getTrailCenter(trail); if (center) openMap(center) }} />
            <SectionHeader title={locales.trails.description} />

            <Text variant="body">{trail.description}</Text>
            <Spacer />
          </Stack>
        </PageTab>
        <PageTab id="spots" label={locales.trails.spots}>
          <TrailSpots spots={trailSpots} />
        </PageTab>
        <PageTab id="stats" label={locales.trails.stats.name}>
          <TrailStats trailId={trail.id} />
        </PageTab>
        <PageTab id="stories" label={locales.discovery.stories}>
          <StoryUserContentSection
            storyContextId={trail.id}
            onSave={async (data) => {
              const result = await storyApplication.upsertTrailStory(trail.id, data)
              if (result.success) setStoriesRefreshKey(k => k + 1)
              return result.success ?? false
            }}
            onDelete={async (storyId) => {
              const result = await storyApplication.deleteStory(storyId, trail.id)
              if (result.success) setStoriesRefreshKey(k => k + 1)
              return result.success ?? false
            }}
          />
          <TrailStories trailId={trail.id} refreshKey={storiesRefreshKey} />
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

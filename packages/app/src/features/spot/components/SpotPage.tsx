import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { useAccountId } from '@app/features/account'
import { Button, ContentBlockList, Page, PageTab, PageTabs, SectionHeader, Spacer, Stack, Text } from '@app/shared/components'
import { useRemoveDialog } from '@app/shared/components/dialog/Dialog'
import { closeOverlay, setOverlay } from '@app/shared/overlay'
import { Theme, useTheme } from '@app/shared/theme'

import DiscoveryStats from '@app/features/discovery/components/DiscoveryStats'
import StoryUserContentSection from '@app/features/story/components/StoryUserContentSection'
import SpotStories from '@app/features/spot/components/SpotStories'
import { LocationChip } from '@app/shared/components'
import { useExternalMap } from '@app/shared/hooks'
import { useLocalization } from '@app/shared/localization'
import { getAppContextStore } from '@app/shared/stores/appContextStore'
import SpotCard from '../card/components/SpotCard'
import { useSpotCardDimensions } from '../card/hooks/useSpotCardDimensions'
import { useEditSpotPage } from '../creation/components/SpotCreationPage.tsx'
import { useSpotWithDiscovery } from '../hooks/useSpotWithDiscovery'
import SpotMetaCard from './SpotMetaCard'

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
  const { styles, theme } = useTheme(createStyles)
  const { locales } = useLocalization()
  const { storyApplication, spotApplication, discoveryApplication } = getAppContextStore()
  const { width, height } = useSpotCardDimensions()
  const { spot, discovery, isLoading } = useSpotWithDiscovery(spotId)
  const { openMap } = useExternalMap(spot?.location)
  const accountId = useAccountId()
  const { showEditSpotPage } = useEditSpotPage()
  const { openDialog, closeDialog } = useRemoveDialog()

  const isOwner = spot?.createdBy === accountId
  const [storiesRefreshKey, setStoriesRefreshKey] = useState(0)

  // Fetch full spot data (including contentBlocks) and rating summary on open
  useEffect(() => {
    spotApplication.getSpot(spotId)
    discoveryApplication.getSpotRatingSummary(spotId)
  }, [spotId])

  // Load existing story once the discovery is available
  useEffect(() => {
    if (discovery?.id) storyApplication.getSpotStory(discovery.id)
  }, [discovery?.id])

  const handleEdit = () => {
    if (!spot) return
    showEditSpotPage(spot)
  }

  const handleDelete = () => {
    if (!spot) return

    openDialog({
      message: `${locales.common.delete} "${spot.name}"?`,
      onConfirm: async () => {
        const result = await spotApplication.deleteSpot(spotId)
        if (result.success) {
          closeDialog()
          onClose?.()
        }
      }
    })
  }

  return (
    <Page
      style={styles.container}
      title={spot?.name}
      leading={<Button icon="arrow-back" variant='outlined' onPress={onClose} />}
      trailing={isOwner ? (
        <View style={styles.actions}>
          <Button icon="edit" variant='outlined' onPress={handleEdit} />
          <Button icon="delete" variant='outlined' onPress={handleDelete} />
        </View>
      ) : undefined}
      loading={isLoading}
    >
      {spot && (
        <PageTabs variant="chips" defaultTab="overview">
          <PageTab id="overview" label={locales.trails.overview}>
            <Stack spacing='lg' style={styles.tabContent}>
              <SpotCard
                style={{ alignSelf: 'center' }}
                width={width}
                height={height}
                image={spot.image}
                blurredImage={spot.blurredImage}
                title={spot.name}
              />
              <LocationChip location={spot.location} style={{ alignSelf: 'center' }} onPress={() => openMap(spot.location)} />

              <SpotMetaCard
                spotId={spotId}
                createdBy={spot.createdBy!}
                createdAt={spot.createdAt}
                discoveredAt={discovery?.discoveredAt}
              />
              <Spacer />
              <SectionHeader title={'Description'} />

              <Text variant='body'>{spot.description === "" ? '-' : spot.description}</Text>

              {spot.contentBlocks && spot.contentBlocks.length > 0 && (
                <ContentBlockList blocks={spot.contentBlocks} />
              )}

            </Stack>
          </PageTab>
          <PageTab id="stats" label={locales.trails.stats.name}>
            <View style={styles.tabContent}>
              {discovery && <DiscoveryStats discoveryId={discovery?.id} />}
            </View>
          </PageTab>
          <PageTab id="stories" label={locales.discovery.stories}>
            <View style={styles.tabContent}>
              {discovery && (
                <StoryUserContentSection
                  storyContextId={discovery.id}
                  onSave={async (data) => {
                    const result = await storyApplication.upsertSpotStory(discovery.id, data)
                    if (result.success) setStoriesRefreshKey(k => k + 1)
                    return result.success ?? false
                  }}
                  onDelete={async (storyId) => {
                    const result = await storyApplication.deleteStory(storyId, discovery.id)
                    if (result.success) setStoriesRefreshKey(k => k + 1)
                    return result.success ?? false
                  }}
                />
              )}
              <SpotStories spotId={spotId} refreshKey={storiesRefreshKey} />
            </View>
          </PageTab>
        </PageTabs>
      )}
    </Page>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContent: {
    paddingBottom: theme.tokens.spacing.xl,
  },
  image: {
    borderRadius: theme.tokens.borderRadius.md,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.tokens.spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: theme.tokens.spacing.sm,
  },
  metaCell: {
    flex: 1,
  },
})

export default SpotPage

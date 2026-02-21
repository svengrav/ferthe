import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'

import { useAccountId } from '@app/features/account'
import { Button, ContentBlockList, Page, PageTab, PageTabs, Stack, Text } from '@app/shared/components'
import { useRemoveDialog } from '@app/shared/components/dialog/Dialog'
import { closeOverlay, setOverlay } from '@app/shared/overlay'
import { Theme, useTheme } from '@app/shared/theme'

import DiscoveryStats from '@app/features/discovery/components/DiscoveryStats'
import DiscoveryUserContentSection from '@app/features/discovery/components/DiscoveryUserContentSection'
import SpotRating from '@app/features/discovery/components/SpotRating'
import { useLocalization } from '@app/shared/localization'
import SpotCard from '../card/components/SpotCard'
import { useSpotCardDimensions } from '../card/hooks/useSpotCardDimensions'
import { useEditSpotPage } from '../creation/components/SpotFormPage'
import { useSpotWithDiscovery } from '../hooks/useSpotWithDiscovery'
import { SpotLocation } from './SpotLocation'
import SpotStatus from './SpotStatus'
import { getAppContextStore } from '@app/shared/stores/appContextStore'

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
  const { locales } = useLocalization()
  const context = getAppContextStore()
  const { width, height } = useSpotCardDimensions()
  const { spot, discovery, isLoading } = useSpotWithDiscovery(spotId)
  const accountId = useAccountId()
  const { showEditSpotPage } = useEditSpotPage()
  const { openDialog, closeDialog } = useRemoveDialog()

  const isOwner = spot?.createdBy === accountId

  // Fetch full spot data (including contentBlocks) and rating summary on open
  useEffect(() => {
    context.spotApplication.getSpot(spotId)
    context.discoveryApplication.getSpotRatingSummary(spotId)
  }, [spotId])

  const handleEdit = () => {
    if (!spot) return
    showEditSpotPage(spot)
  }

  const handleDelete = () => {
    if (!spot) return

    openDialog({
      message: `${locales.common.delete} "${spot.name}"?`,
      onConfirm: async () => {
        const result = await context.spotApplication.deleteSpot(spotId)
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
            <Stack spacing='md'>
              <SpotCard
                style={{ alignSelf: 'center' }}
                width={width}
                height={height}
                image={spot.image}
                blurredImage={spot.blurredImage}
                title={spot.name}
              />
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <SpotStatus spot={spot} discovery={discovery} />
                <SpotLocation location={spot.location} />
                <Text variant="body">{spot.createdAt?.toDateString()}</Text>

              </View>

              <SpotRating spotId={spotId} />

              <Text variant='section'>Description</Text>
              <Text variant='body'>{spot.description}</Text>

              {spot.contentBlocks && spot.contentBlocks.length > 0 && (
                <ContentBlockList blocks={spot.contentBlocks} />
              )}


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
  actions: {
    flexDirection: 'row',
    gap: theme.tokens.spacing.sm,
  },
})

export default SpotPage

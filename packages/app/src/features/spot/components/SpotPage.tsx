import { StyleSheet, View } from 'react-native'

import { useAccountId } from '@app/features/account'
import { Button, ContentBlockList, Page, PageTab, PageTabs, Stack, Text } from '@app/shared/components'
import { useRemoveDialog } from '@app/shared/components/dialog/Dialog'
import { closeOverlay, setOverlay } from '@app/shared/overlay'
import { Theme, useTheme } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'

import { DiscoveryStats, DiscoveryUserContentSection } from '@app/features/discovery'
import SpotRating from '@app/features/discovery/components/SpotRating'
import { useSpotWithDiscovery } from '../hooks/useSpotWithDiscovery'
import SpotCard from '../card/components/SpotCard'
import { useSpotCardDimensions } from '../card/hooks/useSpotCardDimensions'
import { useEditSpotPage } from '../creation/components/SpotFormPage'
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
  const { locales, context } = useApp()
  const { width, height } = useSpotCardDimensions()
  const { spot, discovery, isLoading } = useSpotWithDiscovery(spotId)
  const accountId = useAccountId()
  const { showEditSpotPage } = useEditSpotPage()
  const { openDialog } = useRemoveDialog()

  const isOwner = spot?.createdBy === accountId

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

              {spot.contentBlocks && spot.contentBlocks.length > 0 && (
                <ContentBlockList blocks={spot.contentBlocks} />
              )}

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
  actions: {
    flexDirection: 'row',
    gap: theme.tokens.spacing.sm,
  },
})

export default SpotPage

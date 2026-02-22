import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'

import { useAccountId } from '@app/features/account'
import { Button, ContentBlockList, Page, PageTab, PageTabs, Stack, Text } from '@app/shared/components'
import { useRemoveDialog } from '@app/shared/components/dialog/Dialog'
import { closeOverlay, setOverlay } from '@app/shared/overlay'
import { Theme, useTheme } from '@app/shared/theme'

import AccountSmartCard from '@app/features/account/components/AccountSmartCard.tsx'
import DiscoveryStats from '@app/features/discovery/components/DiscoveryStats'
import DiscoveryUserContentSection from '@app/features/discovery/components/DiscoveryUserContentSection'
import SpotRating from '@app/features/spot/components/SpotRating.tsx'
import { useLocalization } from '@app/shared/localization'
import { getAppContextStore } from '@app/shared/stores/appContextStore'
import { formatDate } from '@app/shared/utils/dateTimeUtils.ts'
import SpotCard from '../card/components/SpotCard'
import { useSpotCardDimensions } from '../card/hooks/useSpotCardDimensions'
import { useEditSpotPage } from '../creation/components/SpotCreationPage.tsx'
import { useSpotWithDiscovery } from '../hooks/useSpotWithDiscovery'
import { SpotLocation } from './SpotLocation'

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
            <Stack spacing='lg'>
              <SpotCard
                style={{ alignSelf: 'center' }}
                width={width}
                height={height}
                image={spot.image}
                blurredImage={spot.blurredImage}
                title={spot.name}
              />
              <SpotLocation location={spot.location} style={{ alignSelf: 'center' }} />

              <View style={{ borderWidth: 1, gap: 8, borderColor: theme.colors.divider, padding: theme.tokens.spacing.md, backgroundColor: theme.colors.background, borderRadius: theme.tokens.borderRadius.md }}>
                <View style={{ flexDirection: 'row', flex: 1, gap: 8, }}>
                  <View style={{ flex: 1 }}>
                    <AccountSmartCard accountId={spot.createdBy!} variant='secondary' style={{ backgroundColor: 'transparent', padding: 0 }} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <SpotRating spotId={spotId} style={{ alignSelf: 'flex-start' }} />

                  </View>
                </View>

                <View style={{ flexDirection: 'row', flex: 1, gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="caption">Created</Text>
                    <Text variant="body">{formatDate(spot.createdAt)}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text variant="caption">Entdeckt</Text>
                    <Text variant="body">{formatDate(discovery?.discoveredAt)}</Text>
                  </View>
                </View>
              </View>


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
    paddingBottom: theme.tokens.spacing.lg
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

import { Avatar, Button, Text } from '@app/shared/components'
import { useLocalization } from '@app/shared/localization'
import { OverlayCard, closeOverlay, setOverlay } from '@app/shared/overlay'
import { getAppContextStore } from '@app/shared/stores/appContextStore.ts'
import { Theme, useTheme } from '@app/shared/theme'
import { logger } from '@app/shared/utils/logger'
import { Community } from '@shared/contracts'
import { useCallback, useState } from 'react'
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native'
import { useCommunityData } from '../stores/communityStore'

export const useCommunityShareDialog = () => ({
  showCommunityShare: (discoveryId: string) => setOverlay(
    'communityShare',
    <CommunityShareDialog
      discoveryId={discoveryId}
      onClose={() => closeOverlay('communityShare')}
    />,
  ),
  closeCommunityShare: () => closeOverlay('communityShare'),
})

interface CommunityShareDialogProps {
  discoveryId: string
  onClose: () => void
}

/**
 * Dialog for sharing a discovery to a community.
 * Shows list of communities and allows selection via radio button.
 */
function CommunityShareDialog(props: CommunityShareDialogProps) {
  const { discoveryId, onClose } = props
  const { styles, theme } = useTheme(createStyles)
  const { locales } = useLocalization()
  const { communityApplication } = getAppContextStore()
  const { communities } = useCommunityData()

  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)

  const handleShare = useCallback(async () => {
    if (!selectedCommunityId) return

    setIsSharing(true)
    const result = await communityApplication.shareDiscovery(discoveryId, selectedCommunityId)

    if (result.success) {
      logger.log('[CommunityShareDialog] Discovery shared', { communityId: selectedCommunityId, discoveryId })
      onClose()
    } else if (result.error) {
      logger.error('[CommunityShareDialog] Share failed', result.error)
      // Show error message based on error code
      const errorMessage = getErrorMessage(result.error.code, locales)
      logger.error('[CommunityShareDialog] Error: ' + errorMessage)
    }

    setIsSharing(false)
  }, [selectedCommunityId, communityApplication, discoveryId, onClose, locales])

  const renderCommunityItem = useCallback(({ item }: { item: Community }) => {
    const isSelected = selectedCommunityId === item.id

    return (
      <TouchableOpacity
        style={styles.communityItem}
        onPress={() => setSelectedCommunityId(item.id)}
      >
        <Avatar
          label={item.name}
          size={40}
        />
        <Text variant="body" style={styles.communityName}>
          {item.name}
        </Text>
        <View style={[styles.radio, isSelected && styles.radioSelected]}>
          {isSelected && <View style={styles.radioDot} />}
        </View>
      </TouchableOpacity>
    )
  }, [selectedCommunityId, styles])

  return (
    <OverlayCard
      title={locales.community.shareDiscovery}
      onClose={onClose}
      scrollable={false}
    >
      <View style={styles.container}>
        <Text variant="caption" style={styles.subtitle}>
          {locales.community.selectCommunity}
        </Text>

        {communities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text variant="caption" style={styles.emptyText}>
              {locales.community.noDiscoveriesYet}
            </Text>
          </View>
        ) : (
          <FlatList
            data={communities}
            renderItem={renderCommunityItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
          />
        )}

        <View style={styles.actions}>
          <Button
            label={locales.common.cancel}
            onPress={onClose}
            variant="secondary"
            disabled={isSharing}
          />
          <Button
            label={locales.community.shareDiscovery}
            onPress={handleShare}
            variant="primary"
            disabled={!selectedCommunityId || isSharing}
          />
        </View>
      </View>
    </OverlayCard>
  )
}

function getErrorMessage(errorCode: string, locales: any): string {
  switch (errorCode) {
    case 'DISCOVERY_ALREADY_SHARED':
      return locales.community.alreadyShared
    case 'DISCOVERY_TOO_OLD':
      return locales.community.discoveryTooOld
    case 'SPOT_NOT_IN_TRAIL':
      return locales.community.notInCommunityTrail
    default:
      return locales.community.shareFailed
  }
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    gap: 16,
    minHeight: 300,
    maxHeight: 500,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 8,
  },
  communityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: theme.tokens.borderRadius.md,
    backgroundColor: theme.colors.background,
  },
  communityName: {
    flex: 1,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.onSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: theme.colors.primary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    opacity: 0.5,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
})

export default CommunityShareDialog

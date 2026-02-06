import { Avatar, PressableWithActions, Text } from '@app/shared/components'
import { useDialog } from '@app/shared/components/dialog/Dialog'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { closeOverlay, setOverlay } from '@app/shared/overlay'
import { Theme, useTheme } from '@app/shared/theme'
import { logger } from '@app/shared/utils/logger'
import { Community } from '@shared/contracts'
import { StyleSheet, View } from 'react-native'
import CommunityDiscoveryPage from './CommunityDiscoveryPage'

interface CommunityCardProps {
  community: Community
}

/**
 * Card component displaying community info.
 * Provides navigation to shared discoveries and actions via long-press dropdown.
 */
function CommunityCard({ community }: CommunityCardProps) {
  const { styles } = useTheme(createStyles)
  const { t } = useLocalizationStore()
  const { openDialog, closeDialog } = useDialog()

  const handleLeave = async (communityId: string) => {
    logger.log(`Leave community: ${communityId}`)
    // TODO: Implement leave functionality when API is ready
    // await communityApplication.leaveCommunity(communityId)
  }

  const handleRemove = async (communityId: string) => {
    logger.log(`Remove community: ${communityId}`)
    // TODO: Implement remove functionality when API is ready
    // await communityApplication.removeCommunity(communityId)
  }

  const confirmRemove = (communityId: string) => {
    openDialog({
      title: t.community.remove,
      message: t.community.confirmRemove,
      confirmText: t.community.remove,
      cancelText: t.common.cancel,
      destructive: true,
      onConfirm: async () => {
        await handleRemove(communityId)
        closeDialog()
      },
      onCancel: closeDialog,
    })
  }

  const handlePress = () => {
    setOverlay(
      'communityDiscoveries',
      <CommunityDiscoveryPage communityId={community.id} communityName={community.name} onBack={() => closeOverlay('communityDiscoveries')} />,
    )
  }

  return (
    <PressableWithActions
      style={styles.card}
      onPress={handlePress}
      actions={[
        {
          label: t.community.leave,
          onPress: () => handleLeave(community.id),
        },
        {
          label: t.community.remove,
          onPress: () => confirmRemove(community.id),
        }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar size={60} />
        <View>
          <Text variant="title">{community.name}</Text>

          <Text variant="body" style={styles.inviteCode}>
            Invite Code: {community.inviteCode}
          </Text>

          <Text variant="body" style={styles.meta}>
            Created {new Date(community.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </PressableWithActions>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  card: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeCard: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.opacity(theme.colors.primary, 10),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeBadge: {
    color: theme.colors.primary,
    backgroundColor: theme.opacity(theme.colors.primary, 10),
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
  },
  inviteCode: {
    marginBottom: 4,
  },
  meta: {
  },
})

export default CommunityCard

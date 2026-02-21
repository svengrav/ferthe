import { StyleSheet, View } from 'react-native'

import { Avatar, PressableWithActions, Text } from '@app/shared/components'
import { useRemoveDialog } from '@app/shared/components/dialog/Dialog'
import { Theme, useTheme } from '@app/shared/theme'
import { logger } from '@app/shared/utils/logger'

import { Community } from '@shared/contracts'

import { useLocalization } from '@app/shared/localization'
import { getAppContextStore } from '@app/shared/stores/appContextStore'
import { useCommunityDiscoveryPage } from './CommunityDiscoveryPage'

interface CommunityCardProps {
  community: Community
}

/**
 * Card component displaying community info.
 * Provides navigation to shared discoveries and actions via long-press dropdown.
 */
function CommunityCard(props: CommunityCardProps) {
  const { community } = props
  const { styles } = useTheme(createStyles)
  const { locales } = useLocalization()
  const { openDialog, closeDialog } = useRemoveDialog()
  const { showCommunityDiscoveries } = useCommunityDiscoveryPage()
  const { communityApplication } = getAppContextStore()

  const handleLeave = async (communityId: string) => {
    const result = await communityApplication.leaveCommunity(communityId)
    if (result.success) {
      logger.log(`Left community: ${communityId}`)
    } else {
      logger.error('Failed to leave community:', result.error)
    }
  }

  const handleRemove = async (communityId: string) => {
    const result = await communityApplication.removeCommunity(communityId)
    if (result.success) {
      logger.log(`Removed community: ${communityId}`)
    } else {
      logger.error('Failed to remove community:', result.error)
    }
  }

  const confirmRemove = (communityId: string) => {
    openDialog({
      message: locales.community.confirmRemove,
      onConfirm: async () => {
        await handleRemove(communityId)
        closeDialog()
      },
      onCancel: closeDialog,
    })
  }

  const handlePress = () => {
    showCommunityDiscoveries(community.id, community.name)
  }

  return (
    <PressableWithActions
      style={styles.card}
      onPress={handlePress}
      actions={[
        {
          label: locales.community.leave,
          onPress: () => handleLeave(community.id),
        },
        {
          label: locales.community.remove,
          onPress: () => confirmRemove(community.id),
        }]}>
      <View style={styles.content}>
        <Avatar size={60} />
        <View>
          <Text variant="title">{community.name}</Text>

          <Text variant="body" style={styles.inviteCode}>
            {locales.community.inviteCode}: {community.inviteCode}
          </Text>

          <Text variant="body" style={styles.meta}>
            {locales.community.created} {new Date(community.createdAt).toLocaleDateString()}
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
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.tokens.spacing.md,
  },
  inviteCode: {
    marginBottom: 4,
  },
  meta: {
  },
})

export default CommunityCard

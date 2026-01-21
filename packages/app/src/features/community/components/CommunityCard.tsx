import { getAppContext } from '@app/appContext'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { Community } from '@shared/contracts'
import { Pressable, Text, View } from 'react-native'
import { useActiveCommunityId } from '../stores/communityStore'

interface CommunityCardProps {
  community: Community
}

function CommunityCard({ community }: CommunityCardProps) {
  const { styles } = useApp(useStyles)
  const activeCommunityId = useActiveCommunityId()
  const { communityApplication } = getAppContext()

  if (!styles) return null

  const isActive = activeCommunityId === community.id

  const handlePress = () => {
    if (isActive) {
      communityApplication.setActiveCommunity(undefined)
    } else {
      communityApplication.setActiveCommunity(community.id)
    }
  }

  return (
    <Pressable onPress={handlePress} style={[styles.card, isActive && styles.activeCard]}>
      <View style={styles.header}>
        <Text style={styles.name}>{community.name}</Text>
        {isActive && <Text style={styles.activeBadge}>Active</Text>}
      </View>
      <Text style={styles.inviteCode}>Invite Code: {community.inviteCode}</Text>
      <Text style={styles.meta}>Created {new Date(community.createdAt).toLocaleDateString()}</Text>
    </Pressable>
  )
}

const useStyles = createThemedStyles(theme => ({
  card: {
    padding: 16,
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
  name: {
    ...theme.text.size.lg,
    fontFamily: theme.text.primary.semiBold,
    color: theme.colors.onSurface,
  },
  activeBadge: {
    ...theme.text.size.xs,
    fontFamily: theme.text.primary.semiBold,
    color: theme.colors.primary,
    backgroundColor: theme.opacity(theme.colors.primary, 10),
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  inviteCode: {
    ...theme.text.size.md,
    fontFamily: theme.text.primary.semiBold,
    color: theme.deriveColor(theme.colors.onSurface, 0.6),
    marginBottom: 4,
  },
  meta: {
    ...theme.text.size.sm,
    color: theme.deriveColor(theme.colors.onSurface, 0.6),
  },
}))

export default CommunityCard

import { getAppContext } from '@app/appContext'
import { Button, Text } from '@app/shared/components'
import { setOverlay } from '@app/shared/overlay'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { Community } from '@shared/contracts'
import { Pressable, View } from 'react-native'
import { useActiveCommunityId } from '../stores/communityStore'
import CommunityDiscoveriesScreen from './CommunityDiscoveriesScreen'

interface CommunityCardProps {
  community: Community
}

/**
 * Card component displaying community info with active state toggle.
 * Provides navigation to shared discoveries.
 */
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

  const handleViewDiscoveries = () => {
    setOverlay(
      'communityDiscoveries',
      <CommunityDiscoveriesScreen
        communityId={community.id}
        communityName={community.name}
        onBack={() => setOverlay('communityDiscoveries', null)}
      />
    )
  }

  return (
    <Pressable onPress={handlePress} style={[styles.card, isActive && styles.activeCard]}>
      <View style={styles.header}>
        <Text variant="subtitle">{community.name}</Text>
        {isActive && <Text style={styles.activeBadge}>Active</Text>}
      </View>

      <Text variant="caption" style={styles.inviteCode}>
        Invite Code: {community.inviteCode}
      </Text>

      <Text variant="caption" style={styles.meta}>
        Created {new Date(community.createdAt).toLocaleDateString()}
      </Text>

      <View style={styles.actions}>
        <Button label="View Discoveries" onPress={handleViewDiscoveries} />
      </View>
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
  activeBadge: {
    color: theme.colors.primary,
    backgroundColor: theme.opacity(theme.colors.primary, 10),
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
  },
  inviteCode: {
    color: theme.deriveColor(theme.colors.onSurface, 0.6),
    marginBottom: 4,
  },
  meta: {
    color: theme.deriveColor(theme.colors.onSurface, 0.6),
    marginBottom: 12,
  },
  actions: {
    marginTop: 8,
  },
}))

export default CommunityCard

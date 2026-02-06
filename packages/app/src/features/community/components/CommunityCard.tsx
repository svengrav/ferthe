import { Avatar, Text } from '@app/shared/components'
import { setOverlay } from '@app/shared/overlay'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { Community } from '@shared/contracts'
import { Pressable, View } from 'react-native'
import CommunityDiscoveryPage from './CommunityDiscoveryPage.tsx'

interface CommunityCardProps {
  community: Community
}

/**
 * Card component displaying community info with active state toggle.
 * Provides navigation to shared discoveries.
 */
function CommunityCard({ community }: CommunityCardProps) {
  const { styles } = useApp(useStyles)

  if (!styles) return null

  const handlePress = () => {
    setOverlay(
      'communityDiscoveries',
      <CommunityDiscoveryPage
        communityId={community.id}
        communityName={community.name}
      />
    )
  }

  return (
    <Pressable onPress={handlePress} style={[styles.card]}>
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



      {/* <View style={styles.actions}>
        <Button label="View Discoveries" onPress={handleViewDiscoveries} />
      </View> */}
    </Pressable>
  )
}

const useStyles = createThemedStyles(theme => ({
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
  actions: {
    marginTop: 8,
  },
}))

export default CommunityCard

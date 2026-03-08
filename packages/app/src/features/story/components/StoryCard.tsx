import AccountSmartCard from '@app/features/account/components/AccountSmartCard'
import { useAccountId } from '@app/features/account'
import { Icon, Image, Stack, Text } from '@app/shared/components'
import { getAppContextStore } from '@app/shared/stores/appContextStore'
import { createThemedStyles, useTheme } from '@app/shared/theme'
import { formatDate } from '@app/shared/utils/dateTimeUtils'
import { Story } from '@shared/contracts'
import { useState, useEffect } from 'react'
import { TouchableOpacity, View } from 'react-native'

interface StoryCardProps {
  trailing?: React.ReactNode
  story: Story
}

function StoryCard({ story, trailing }: StoryCardProps) {
  const { styles, theme } = useTheme(useStyles)
  const accountId = useAccountId()
  const { storyApplication } = getAppContextStore()

  const [likedByIds, setLikedByIds] = useState<string[]>(story.likedByAccountIds ?? [])
  const isLiked = !!accountId && likedByIds.includes(accountId)

  // Sync local like state when story prop changes (e.g. after list refresh)
  useEffect(() => {
    setLikedByIds(story.likedByAccountIds ?? [])
  }, [story.likedByAccountIds])

  if (!styles) return null

  const handleLike = async () => {
    if (!accountId) return
    // Optimistic update
    if (isLiked) {
      setLikedByIds(prev => prev.filter(id => id !== accountId))
      await storyApplication.unlikeStory(story.id)
    } else {
      setLikedByIds(prev => [...prev, accountId])
      await storyApplication.likeStory(story.id)
    }
  }

  return (
    <View style={styles.card}>
      <Stack style={{ flex: 1, flexDirection: 'row' }}>
        <AccountSmartCard accountId={story.accountId} style={{ flex: 1 }} />
        {trailing}
      </Stack>
      {story.image && (
        <Image
          source={story.image}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      {story.comment ? (
        <Text variant="body" >{story.comment}</Text>
      ) : null}

      <Stack style={styles.footer}>
        {story.createdAt && (
          <Text variant="caption">
            {formatDate(story.createdAt)}
          </Text>
        )}
        <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
          <Icon name={isLiked ? 'favorite' : 'favorite-border'} size='sm' color={isLiked ? theme.colors.primary : theme.colors.onSurface} />
          <Text variant="caption" style={isLiked ? { color: theme.colors.primary } : undefined}>
            {likedByIds.length}
          </Text>
        </TouchableOpacity>
      </Stack>
    </View>
  )
}

const useStyles = createThemedStyles(theme => ({
  card: {
    gap: theme.tokens.spacing.md,
    borderRadius: theme.tokens.borderRadius.md,
    padding: theme.tokens.inset.md,
    borderColor: theme.colors.divider,
    borderWidth: 1
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: theme.tokens.borderRadius.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
}))

export default StoryCard

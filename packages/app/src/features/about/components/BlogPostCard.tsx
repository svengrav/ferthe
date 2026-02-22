import { Card, Chip, Text } from '@app/shared/components'
import { createThemedStyles, useTheme } from '@app/shared/theme'
import { formatDate } from '@app/shared/utils/dateTimeUtils'
import { Linking, View } from 'react-native'
import { BlogPost } from '../hooks/useBlogPosts'

interface BlogPostCardProps {
  post: BlogPost
}

/**
 * Card displaying a blog post preview with title, date, tags and preview text.
 * Tapping opens the full post on ferthe.de.
 */
function BlogPostCard({ post }: BlogPostCardProps) {
  const { styles } = useTheme(useStyles)

  const handlePress = () => {
    const path = post.url.replace(/^\/api\/[a-z]{2}/, '')
    Linking.openURL(`https://ferthe.de${path}`)
  }

  return (
    <Card variant='secondary' onPress={handlePress} style={styles.card}>
      <View style={{ flexDirection: 'row' }}>

        <Text variant='hint' style={styles.date}>
          {formatDate(post.date)}
        </Text>
        <View style={{ flex: 1 }} />
        {post.tags.length > 0 && (
          <Chip variant='secondary' size='sm' label={post.tags.join(' · ')} />
        )}
      </View>
      <Text variant='title'>{post.title}</Text>

      <Text variant='body' style={styles.preview} numberOfLines={3}>
        {post.preview}
      </Text>
    </Card>
  )
}

const useStyles = createThemedStyles(theme => ({
  card: {
    width: '100%',
    gap: theme.tokens.spacing.xs,
  },
  date: {
    color: theme.deriveColor(theme.colors.onSurface, 0.6),
  },
  tags: {
    color: theme.colors.primary,
  },
  preview: {
    marginTop: theme.tokens.spacing.xs,
  },
}))

export default BlogPostCard

import { Card, Text } from '@app/shared/components'
import { createThemedStyles, useTheme } from '@app/shared/theme'
import { Linking } from 'react-native'
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
      <Text variant='title'>{post.title}</Text>
      <Text variant='hint' style={styles.date}>
        {new Date(post.date).toLocaleDateString()}
      </Text>
      {post.tags.length > 0 && (
        <Text variant='hint' style={styles.tags}>
          {post.tags.join(' · ')}
        </Text>
      )}
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

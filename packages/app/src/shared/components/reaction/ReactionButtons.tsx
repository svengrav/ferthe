import { IconButton } from '@app/shared/components/button/Button'
import Text from '@app/shared/components/text/Text'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { View } from 'react-native'

interface ReactionSummary {
  likes: number
  dislikes: number
  userReaction?: 'like' | 'dislike'
}

interface ReactionButtonsProps {
  summary?: ReactionSummary
  onLike: () => void
  onDislike: () => void
  disabled?: boolean
  variant?: 'default' | 'compact'
}

/**
 * Generic Like/Dislike buttons with reaction counts
 * Reusable across different entities (discoveries, spots, etc.)
 */
const ReactionButtons = ({
  summary,
  onLike,
  onDislike,
  disabled = false,
  variant = 'default',
}: ReactionButtonsProps) => {
  const { styles, theme } = useApp(useStyles)

  if (!styles) return null

  const isLiked = summary?.userReaction === 'like'
  const isDisliked = summary?.userReaction === 'dislike'

  return (
    <View style={styles.container}>
      <View style={styles.buttonGroup}>
        <IconButton
          name="thumb-up"
          variant={isLiked ? 'primary' : 'outlined'}
          onPress={onLike}
          disabled={disabled}
          size={variant === 'compact' ? 16 : 20}
          color={isLiked ? theme.colors.primary : undefined}
        />
        <Text style={styles.count}>{summary?.likes ?? 0}</Text>
      </View>

      <View style={styles.buttonGroup}>
        <IconButton
          name="thumb-down"
          variant={isDisliked ? 'primary' : 'outlined'}
          onPress={onDislike}
          disabled={disabled}
          size={variant === 'compact' ? 16 : 20}
          color={isDisliked ? theme.colors.error : undefined}
        />
        <Text style={styles.count}>{summary?.dislikes ?? 0}</Text>
      </View>
    </View>
  )
}

const useStyles = createThemedStyles(theme => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  count: {
    fontSize: 14,
    color: theme.deriveColor(theme.colors.onSurface, 0.6),
  },
}))

export default ReactionButtons

import { IconButton } from '@app/shared/components/button/Button'
import Text from '@app/shared/components/text/Text'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { ReactionSummary } from '@shared/contracts'
import { View } from 'react-native'

interface ReactionButtonsProps {
  summary?: ReactionSummary
  onLike: () => void
  onDislike: () => void
  disabled?: boolean
}

/**
 * Generic Like/Dislike buttons with reaction counts.
 * Reusable across different entities (discoveries, spots, etc.)
 */
function ReactionButtons({
  summary,
  onLike,
  onDislike,
  disabled = false,
}: ReactionButtonsProps) {
  const { styles, theme } = useApp(useStyles)

  if (!styles) return null

  const isLiked = summary?.userReaction === 'like'
  const isDisliked = summary?.userReaction === 'dislike'

  return (
    <View style={styles.container}>
      <View style={styles.buttonGroup}>
        <IconButton
          name="thumb-up-off-alt"
          variant="outlined"
          onPress={onLike}
          disabled={disabled}
          color={isLiked ? theme.colors.primary : theme.colors.secondary}
          size={18}
        />
        <Text style={styles.count}>{summary?.likes ?? 0}</Text>
      </View>

      <View style={styles.buttonGroup}>
        <IconButton
          name="thumb-down-off-alt"
          variant="outlined"
          onPress={onDislike}
          disabled={disabled}
          size={18}
          color={isDisliked ? theme.colors.primary : theme.colors.secondary}
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
    color: theme.colors.secondary,
  },
}))

export default ReactionButtons

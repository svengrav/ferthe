import { getAppContext } from '@app/appContext'
import ReactionButtons from '@app/shared/components/reaction/ReactionButtons'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { View } from 'react-native'
import { useDiscoveryReactionSummary } from '../index'

interface DiscoveryReactionProps {
  id: string
}

/**
 * Hook to handle reaction actions with loading state
 */
const useReactionHandlers = (id: string, reactionSummary: any, discoveryApplication: any) => {
  const handleReaction = async (reactionType: 'like' | 'dislike') => {
    const isCurrentReaction = reactionSummary?.userReaction === reactionType
    if (isCurrentReaction) {
      await discoveryApplication.removeReaction(id)
    } else {
      await discoveryApplication.reactToDiscovery(id, reactionType)
    }
  }

  return {
    handleLike: () => handleReaction('like'),
    handleDislike: () => handleReaction('dislike'),
  }
}

/**
 * Renders reaction buttons section with like/dislike actions.
 * Encapsulates reaction logic and state management.
 */
function DiscoveryReaction({
  id,
}: DiscoveryReactionProps) {
  const { styles } = useApp(useStyles)
  const { discoveryApplication } = getAppContext()
  const reactionSummary = useDiscoveryReactionSummary(id)

  if (!id || !styles) return null

  const { handleLike, handleDislike } = useReactionHandlers(id, reactionSummary, discoveryApplication)

  return (
    <View style={styles.reactionsContainer}>
      <ReactionButtons
        summary={reactionSummary}
        onLike={handleLike}
        onDislike={handleDislike}
      />
    </View>
  )
}

const useStyles = createThemedStyles(theme => ({
  reactionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
}))

export default DiscoveryReaction

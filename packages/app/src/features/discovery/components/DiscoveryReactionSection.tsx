import { getAppContext } from '@app/appContext'
import ReactionButtons from '@app/shared/components/reaction/ReactionButtons'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { View } from 'react-native'
import { useDiscoveryReactionSummary } from '../index'

interface DiscoveryReactionSectionProps {
  id: string
  isLoading: boolean
}

/**
 * Hook to handle reaction actions with loading state
 */
const useReactionHandlers = (id: string, isLoading: boolean, reactionSummary: any, discoveryApplication: any) => {
  const handleReaction = async (reactionType: 'like' | 'dislike') => {
    if (isLoading) return
    
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
function DiscoveryReactionSection({
  id,
  isLoading,
}: DiscoveryReactionSectionProps) {
  const { styles } = useApp(useStyles)
  const { discoveryApplication } = getAppContext()
  const reactionSummary = useDiscoveryReactionSummary(id)

  if (!id || !styles) return null

  const { handleLike, handleDislike } = useReactionHandlers(id, isLoading, reactionSummary, discoveryApplication)

  return (
    <View style={styles.reactionsContainer}>
      <ReactionButtons
        summary={reactionSummary}
        onLike={handleLike}
        onDislike={handleDislike}
        disabled={isLoading}
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

export default DiscoveryReactionSection

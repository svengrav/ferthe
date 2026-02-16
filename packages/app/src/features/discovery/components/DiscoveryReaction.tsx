import { getAppContext } from '@app/appContext'
import StarRating from '@app/shared/components/reaction/StarRating'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { logger } from '@app/shared/utils/logger'
import { View } from 'react-native'
import { useDiscoveryReactionSummary } from '../index'

interface DiscoveryReactionProps {
  id: string
}

/**
 * Hook to handle rating actions
 */
const useRatingHandler = (id: string, reactionSummary: any, discoveryApplication: any) => {
  const handleRate = async (rating: number) => {
    logger.log('DiscoveryReaction: Rating', { discoveryId: id, rating, currentSummary: reactionSummary })
    const isSameRating = reactionSummary?.userRating === rating
    if (isSameRating) {
      logger.log('DiscoveryReaction: Removing rating (same as current)')
      await discoveryApplication.removeReaction(id)
    } else {
      logger.log('DiscoveryReaction: Submitting new rating')
      await discoveryApplication.reactToDiscovery(id, rating)
    }
  }

  return { handleRate }
}

/**
 * Renders star rating section for discoveries.
 * Encapsulates rating logic and state management.
 */
function DiscoveryRating({
  id,
}: DiscoveryReactionProps) {
  const { styles } = useApp(useStyles)
  const { discoveryApplication } = getAppContext()
  const reactionSummary = useDiscoveryReactionSummary(id)

  if (!id || !styles) return null

  const { handleRate } = useRatingHandler(id, reactionSummary, discoveryApplication)

  return (
    <View style={styles.reactionsContainer}>
      <StarRating
        summary={reactionSummary}
        onRate={handleRate}
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

export default DiscoveryRating

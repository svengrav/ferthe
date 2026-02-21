import StarRating from '@app/shared/components/reaction/StarRating'
import { createThemedStyles, useTheme } from '@app/shared/theme'
import { RatingSummary } from '@shared/contracts'
import { View } from 'react-native'
import { DiscoveryApplication } from '../application'
import { useSpotRatingSummary } from '../stores/spotRatingStore'
import { getAppContextStore } from '@app/shared/stores/appContextStore'

interface SpotRatingProps {
  spotId: string
}

/**
 * Hook to handle rating actions
 */
const useRatingHandler = (spotId: string, ratingSummary: RatingSummary, discoveryApplication: DiscoveryApplication) => {
  const handleRate = async (rating: number) => {
    const isSameRating = ratingSummary?.userRating === rating
    if (isSameRating) {
      await discoveryApplication.removeSpotRating(spotId)
    } else {
      await discoveryApplication.rateSpot(spotId, rating)
    }
  }

  return { handleRate }
}

/**
 * Renders star rating section for spots.
 * Encapsulates rating logic and state management.
 */
function SpotRating({
  spotId,
}: SpotRatingProps) {
  const { styles } = useTheme(useStyles)
  const { discoveryApplication } = getAppContextStore()
  const ratingSummary = useSpotRatingSummary(spotId)

  if (!spotId || !styles) return null

  const { handleRate } = useRatingHandler(spotId, ratingSummary, discoveryApplication)

  return (
    <View style={styles.reactionsContainer}>
      <StarRating
        summary={ratingSummary}
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
  },
}))

export default SpotRating

import StarRating from '@app/shared/components/reaction/StarRating'
import { getAppContextStore } from '@app/shared/stores/appContextStore'
import { createThemedStyles, useTheme } from '@app/shared/theme'
import { RatingSummary } from '@shared/contracts'
import { StyleProp, View, ViewStyle } from 'react-native'
import { TrailApplication } from '../application'
import { useTrailRatingSummary } from '../stores/trailRatingStore'

interface TrailRatingProps {
  trailId: string
  style?: StyleProp<ViewStyle>
}

const useRatingHandler = (trailId: string, ratingSummary: RatingSummary, trailApplication: TrailApplication) => {
  const handleRate = async (rating: number) => {
    const isSameRating = ratingSummary?.userRating === rating
    if (isSameRating) {
      await trailApplication.removeTrailRating(trailId)
    } else {
      await trailApplication.rateTrail(trailId, rating)
    }
  }

  return { handleRate }
}

/**
 * Renders star rating section for trails.
 * Encapsulates rating logic and state management.
 */
function TrailRating({ trailId, style }: TrailRatingProps) {
  const { styles } = useTheme(useStyles)
  const { trailApplication } = getAppContextStore()
  const ratingSummary = useTrailRatingSummary(trailId)

  if (!trailId || !styles) return null

  const { handleRate } = useRatingHandler(trailId, ratingSummary, trailApplication)

  return (
    <View style={[styles.container, style]}>
      <StarRating
        summary={ratingSummary}
        onRate={handleRate}
      />
    </View>
  )
}

const useStyles = createThemedStyles(_theme => ({
  container: {},
}))

export default TrailRating

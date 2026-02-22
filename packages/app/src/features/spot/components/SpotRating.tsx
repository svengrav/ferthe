import { useAccountId } from '@app/features/account'
import StarRating from '@app/shared/components/reaction/StarRating'
import { getAppContextStore } from '@app/shared/stores/appContextStore'
import { createThemedStyles, useTheme } from '@app/shared/theme'
import { RatingSummary } from '@shared/contracts'
import { StyleProp, View, ViewStyle } from 'react-native'
import { DiscoveryApplication } from '../../discovery/application.ts'
import { useSpotRatingSummary } from '../../discovery/stores/spotRatingStore.ts'
import { useSpot } from '../stores/spotStore'

interface SpotRatingProps {
  spotId: string,
  style?: StyleProp<ViewStyle>
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
function SpotRating({ spotId, style }: SpotRatingProps) {
  const { styles } = useTheme(useStyles)
  const { discoveryApplication } = getAppContextStore()
  const ratingSummary = useSpotRatingSummary(spotId)
  const spot = useSpot(spotId)
  const accountId = useAccountId()

  if (!spotId || !styles) return null

  const isOwnSpot = !!spot?.createdBy && spot.createdBy === accountId
  const { handleRate } = useRatingHandler(spotId, ratingSummary, discoveryApplication)

  return (
    <View style={[styles.reactionsContainer, style]}>
      <StarRating
        summary={ratingSummary}
        onRate={handleRate}
        disabled={isOwnSpot}
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

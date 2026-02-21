import Icon from '@app/shared/components/icon/Icon'
import Text from '@app/shared/components/text/Text'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { RatingSummary } from '@shared/contracts'
import { useState } from 'react'
import { Pressable, View } from 'react-native'

interface StarRatingProps {
  summary?: RatingSummary
  onRate: (rating: number) => void
  disabled?: boolean
  size?: number
}

/**
 * Star rating component (1-5 stars) with average display.
 * Shows average rating and allows user to submit their own rating.
 */
function StarRating({
  summary,
  onRate,
  disabled = false,
  size = 24,
}: StarRatingProps) {
  const { styles, theme } = useApp(useStyles)
  const [hoveredStar, setHoveredStar] = useState<number | null>(null)

  if (!styles) return null

  const userRating = summary?.userRating ?? 0
  const average = summary?.average ?? 0
  const count = summary?.count ?? 0

  // Show hovered stars during interaction, otherwise show user's rating
  const displayRating = hoveredStar !== null ? hoveredStar : userRating

  const renderStar = (position: number) => {
    const isFilled = displayRating >= position
    const iconName = isFilled ? 'star' : 'star-border'
    const color = isFilled ? theme.colors.primary : theme.colors.onSurface

    return (
      <Pressable
        key={position}
        onPress={() => {
          if (!disabled) {
            onRate(position)
            setHoveredStar(null)
          }
        }}
        onPressIn={() => setHoveredStar(position)}
        onPressOut={() => setHoveredStar(null)}
        disabled={disabled}
        style={styles.starButton}
      >
        <Icon name={iconName} size='md' color={color} />
      </Pressable>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map(renderStar)}
      </View>
      <Text style={styles.summary}>
        {average.toFixed(1)} ({count})
      </Text>
    </View>
  )
}

const useStyles = createThemedStyles(theme => ({
  container: {
    alignItems: 'center',
    gap: theme.tokens.spacing.sm,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.tokens.spacing.xs,
  },
  starButton: {
    padding: theme.tokens.spacing.xs / 2,
  },
  summary: {
    fontSize: 14,
    color: theme.colors.onSurface,
  },
}))

export default StarRating

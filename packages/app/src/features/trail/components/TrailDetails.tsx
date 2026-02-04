import { Image, Text } from '@app/shared/components'
import { Theme, useTheme } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { Trail } from '@shared/contracts'
import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'

const IMAGE_HEIGHT = 150

interface TrailDetailsProps {
  trail: Trail
}

/**
 * Displays comprehensive information about a trail including name, image, and description.
 */
function TrailDetails({ trail }: TrailDetailsProps) {
  const { styles } = useTheme(createStyles)
  const { context } = useApp()

  // Request trail spot previews on mount or trail change
  useEffect(() => {
    context?.trailApplication.requestTrailSpotPreviews(trail.id)
  }, [trail.id, context])

  return (
    <View style={styles.container}>
      <Text variant="heading">{trail.name}</Text>
      <Image
        style={styles.image}
        source={trail.image}
        height={IMAGE_HEIGHT}
        resizeMode="cover"
      />
      <Text variant="section">Description</Text>
      <Text variant="body">{trail.description}</Text>
    </View>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    gap: theme.tokens.spacing.sm,
  },
  image: {
    borderRadius: theme.tokens.borderRadius.md,
  },
})

export default TrailDetails

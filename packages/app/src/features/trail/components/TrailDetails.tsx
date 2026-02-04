import { Image, Text } from '@app/shared/components'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { Trail } from '@shared/contracts'
import { useEffect } from 'react'
import { View } from 'react-native'
import { useTrailPreviewSpots } from '../stores/trailStore'

// Spacing constants
const TITLE_MARGIN_BOTTOM = 8
const DESCRIPTION_MARGIN_BOTTOM = 16
const SECTION_TITLE_MARGIN_TOP = 16
const SECTION_TITLE_MARGIN_BOTTOM = 4

interface TrailDetailsProps {
  trail: Trail
}

/**
 * Trail details component that displays comprehensive information about a trail
 */
function TrailDetails({ trail }: TrailDetailsProps) {
  const { styles, locales, theme, context } = useApp(useStyles)
  const previews = useTrailPreviewSpots(trail.id)

  const trailApplication = context?.trailApplication
  useEffect(() => {
    trailApplication.requestTrailSpotPreviews(trail.id)
  }, [trail.id])

  if (!styles) return null

  // Simple data formatting
  const trailName = trail.name || 'Unnamed Trail'
  const trailDescription = trail.description || locales.trails.noDescription

  return (
    <View>
      <Text variant="heading">{trailName}</Text>
      <Image
        source={trail.image}
        height={150}
        resizeMode='cover'
      />
      <Text variant="section">Description</Text>
      <Text variant="body">{trailDescription}</Text>

      {/* <SpotCardList cards={previews.map(p => ({
        image: {
          url: p.image?.previewUrl || 'default_spot_image_url',
        }
      }))} /> */}
    </View>
  )
}

const useStyles = createThemedStyles(theme => ({

}))

export default TrailDetails

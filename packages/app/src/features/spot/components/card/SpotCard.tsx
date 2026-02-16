import { ImageReference } from '@shared/contracts'
import { View } from 'react-native'
import SpotContainer from './SpotContainer'
import SpotGradientFrame from './SpotGradientFrame'
import SpotImage from './SpotImage'
import SpotLockIcon from './SpotLockIcon'
import SpotTitle from './SpotTitle'

interface SpotCardProps {
  title?: string,
  image?: ImageReference
  blurredImage?: ImageReference
  discovered: boolean
  width: number
  height: number
  borderRadius?: number
  onPress?: () => void
}

/**
 * Card for spots in trails.
 * Shows full image for discovered spots, blurred image with lock for undiscovered spots.
 */
function SpotCard({
  title,
  image,
  blurredImage,
  discovered,
  width,
  height,
  borderRadius = 10,
  onPress,
}: SpotCardProps) {
  return (
    <SpotContainer
      width={width}
      height={height}
      borderRadius={borderRadius}
      withShadow={true}
      onPress={onPress}
    >
      <SpotGradientFrame colors={['#a341fffd', 'rgba(65, 73, 185, 0.767)']} padding={4}>
        <SpotTitle title={title} />
        {discovered && image ? (
          <SpotImage source={image} borderRadius={borderRadius} />
        ) : blurredImage ? (
          <>
            <SpotImage source={blurredImage} borderRadius={borderRadius} />
            <SpotLockIcon />
          </>
        ) : (
          <>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.1)' }} />
            <SpotLockIcon />
          </>
        )}
      </SpotGradientFrame>
    </SpotContainer>

  )
}

export default SpotCard

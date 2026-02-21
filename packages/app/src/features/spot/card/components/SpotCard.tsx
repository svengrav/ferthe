import { ImageReference } from '@shared/contracts'
import { StyleProp, View, ViewStyle } from 'react-native'
import SpotContainer from './SpotContainer'
import SpotGradientFrame from './SpotGradientFrame'
import SpotImage from './SpotImage'
import SpotLockIcon from './SpotLockIcon'
import SpotTitle from './SpotTitle'

interface SpotCardProps {
  title?: string
  image?: ImageReference
  blurredImage?: ImageReference
  isLocked?: boolean
  width: number
  height: number
  borderRadius?: number
  onPress?: () => void
  style?: StyleProp<ViewStyle>
}

/**
 * Card for spots.
 * isLocked=true: shows lock icon + blurred image (if available) or dark placeholder.
 * isLocked=false: shows full image.
 */
function SpotCard({
  title,
  image,
  blurredImage,
  isLocked = false,
  width,
  height,
  borderRadius = 10,
  onPress,
  style
}: SpotCardProps) {
  return (
    <SpotContainer
      width={width}
      height={height}
      borderRadius={borderRadius}
      withShadow={true}
      onPress={onPress}
      style={style}
    >
      <SpotGradientFrame colors={['#a341fffd', 'rgba(65, 73, 185, 0.767)']} padding={4}>
        <SpotTitle title={title} />
        {isLocked ? (
          <>
            {blurredImage
              ? <SpotImage source={blurredImage} borderRadius={borderRadius} />
              : <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.1)' }} />
            }
            <SpotLockIcon />
          </>
        ) : image ? (
          <SpotImage source={image} borderRadius={borderRadius} />
        ) : (
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.1)' }} />
        )}
      </SpotGradientFrame>
    </SpotContainer>
  )
}

export default SpotCard

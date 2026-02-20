import { ImageReference } from '@shared/contracts'
import { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import SpotContainer from './SpotContainer'
import SpotGradientFrame from './SpotGradientFrame'
import SpotImage from './SpotImage'
import SpotLockIcon from './SpotLockIcon'
import SpotTitle from './SpotTitle'

interface SpotCardProps {
  title?: string,
  image?: ImageReference
  blurredImage?: ImageReference
  width: number
  height: number
  borderRadius?: number
  onPress?: () => void
  /** Optional overlay content rendered on top of the card image area. */
  children?: ReactNode
}

/**
 * Card for spots in trails.
 * Shows full image for discovered spots, blurred image with lock for undiscovered spots.
 */
function SpotCard({
  title,
  image,
  blurredImage,
  width,
  height,
  borderRadius = 10,
  onPress,
  children,
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
        {image ? (
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
        {children && <View style={styles.overlay}>{children}</View>}
      </SpotGradientFrame>
    </SpotContainer>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default SpotCard

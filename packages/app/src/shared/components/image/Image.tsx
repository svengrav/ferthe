import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { memo, useEffect, useState } from 'react'
import { Image as RNImage, ImageProps as RNImageProps, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { LoadingSpinner } from '../activityIndicator/ActivityIndicator'

// Constants
const LOADING_Z_INDEX = 1000
const FADE_OUT_DURATION = 500
const DEFAULT_FILL_COLOR = '#000000'

/**
 * Animated wrapper component for loading indicator with fade-out transition
 */
const AnimatedLoadingIndicator = (props: { visible: boolean; fill?: string; children: React.ReactNode }) => {
  const { visible, children, fill = DEFAULT_FILL_COLOR } = props
  const opacity = useSharedValue(1)

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: FADE_OUT_DURATION })
  }, [visible, opacity])

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: LOADING_Z_INDEX,
    flex: 1,
    opacity: opacity.value,
    backgroundColor: fill
  }))

  // Don't render if completely faded out
  if (!visible && opacity.value === 0) return null

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  )
}

interface ImageProps extends Omit<RNImageProps, 'source'> {
  source: { uri: string }
  width?: number
  height?: number
  borderRadius?: number
  showLoader?: boolean
  fill?: string
  onLoadStart?: () => void
  onLoadEnd?: () => void
  onError?: () => void
}

/**
 * Custom Image component with loading state and additional styling options.
 * Extends React Native's Image with loading indicators and consistent styling.
 */
function Image({
  source,
  width,
  height,
  borderRadius,
  showLoader = false,
  onLoadStart,
  onLoadEnd,
  style,
  fill = DEFAULT_FILL_COLOR,
  ...props
}: ImageProps) {

  const { styles } = useApp(useStyles)
  const [isLoading, setIsLoading] = useState(true)

  // Event handlers
  const handleLoadStart = () => {
    onLoadStart?.()
  }

  const handleLoadEnd = () => {
    setIsLoading(false)
    onLoadEnd?.()
  }

  // Dynamic styles
  const getImageStyle = () => [
    styles!.image,
    {
      width,
      height,
      borderRadius,
    },
    style,
  ]

  const getContainerStyle = () => [
    styles!.container,
    { width, height, maxHeigth: height, maxWidth: width, minHeight: height, minWidth: width },
  ]

  return (
    <View style={getContainerStyle()}>
      <RNImage
        source={source}
        style={getImageStyle()}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        {...props}
      />
      <AnimatedLoadingIndicator visible={isLoading} fill={fill}>
        {showLoader && <LoadingSpinner />}
      </AnimatedLoadingIndicator>
    </View>
  )
}

const useStyles = createThemedStyles(theme => ({
  container: {
    overflow: 'hidden',
    flex: 1,
    borderRadius: 6,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    flex: 1,
    zIndex: LOADING_Z_INDEX,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
}))

export default memo(Image)
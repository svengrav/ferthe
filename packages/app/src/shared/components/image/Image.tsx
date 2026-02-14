import { useEffect, useState } from 'react'
import { ActivityIndicator, ImageStyle, Image as RNImage, ImageProps as RNImageProps, StyleProp, View } from 'react-native'

import { ImageReference } from '@shared/contracts'

import { Text } from '@app/shared/components/'
import { createThemedStyles } from '../../theme'
import { useApp } from '../../useApp'

const LABEL_MAX_LENGTH = 2
const LABEL_SIZE_RATIO = 0.4

interface ImageProps {
  source: ImageReference | { uri: string } | undefined
  label?: string
  style?: StyleProp<ImageStyle>
  width?: number
  height?: number
  placeholder?: React.ReactNode
  onError?: () => void
  resizeMode?: RNImageProps['resizeMode']
}

/**
 * Image component with automatic loading states, preview support, and error handling.
 * 
 * Features:
 * - Shows placeholder while loading
 * - Progressive loading: preview → full image
 * - Graceful error handling with label fallback
 * - Supports both ImageReference and simple { uri: string } sources
 */
export function Image({
  source,
  label,
  style,
  width,
  height,
  placeholder,
  onError,
  resizeMode = 'cover',
}: ImageProps) {
  const { styles } = useApp(useStyles)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Determine URIs and label
  const isImageReference = source && 'id' in source
  const previewUri = isImageReference ? source.previewUrl : undefined
  const fullUri = isImageReference ? source.url : source?.uri
  const effectiveLabel = label || (isImageReference ? source.label : undefined)
  const labelText = effectiveLabel ? effectiveLabel.substring(0, LABEL_MAX_LENGTH).toUpperCase() : ''

  useEffect(() => {
    setIsLoading(true)
    setHasError(false)
    setShowPreview(Boolean(previewUri))
  }, [fullUri, previewUri])

  const handleLoadEnd = () => {
    setIsLoading(false)
    setShowPreview(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }

  if (!styles) return null

  const containerStyle = [styles.container, { width, height }, style]
  const dynamicLabelFontSize = Math.min(width ?? height ?? 50, height ?? width ?? 50) * LABEL_SIZE_RATIO

  // Label fallback
  const renderFallback = () => (
    <View style={styles.fallbackContainer}>
      <Text style={[styles.fallbackText, { fontSize: dynamicLabelFontSize }]}>
        {labelText || placeholder}
      </Text>
    </View>
  )

  // No source or error
  if (!source || !fullUri || hasError) {
    return <View style={containerStyle}>{renderFallback()}</View>
  }

  return (
    <View style={containerStyle}>
      {/* Preview image (blurred) */}
      {showPreview && previewUri && (
        <RNImage
          source={{ uri: previewUri }}
          style={styles.image}
          resizeMode={resizeMode}
        />
      )}

      {/* Full image */}
      <RNImage
        source={{ uri: fullUri }}
        style={styles.image}
        resizeMode={resizeMode}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
      />

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" />
        </View>
      )}
    </View>
  )
}

const useStyles = createThemedStyles(theme => ({
  container: {
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    color: theme.colors.onPrimary,
    fontWeight: '600',
  },
  loadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
}))

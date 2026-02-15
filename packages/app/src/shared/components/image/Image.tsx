import { ImageReference } from '@shared/contracts';
import { Image as ExpoImage, ImageContentFit } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, ImageStyle, StyleProp, View } from 'react-native';

import { Text } from '@app/shared/components/';
import React from 'react';
import { createThemedStyles, useTheme } from '../../theme';
import { useApp } from '../../useApp';

const LABEL_MAX_LENGTH = 2
const LABEL_SIZE_RATIO = 0.4

type LoadingState = 'loading' | 'loaded' | 'error'

interface ImageProps {
  source: ImageReference | { uri: string } | undefined
  label?: string
  style?: StyleProp<ImageStyle>
  width?: number
  height?: number
  placeholder?: React.ReactNode
  onError?: () => void
  onLoad?: () => void
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center'
}

/**
 * Image component with automatic loading states and error handling.
 * 
 * Features:
 * - Shows placeholder while loading
 * - Smooth fade-in transition on load (via expo-image)
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
  onLoad,
  resizeMode = 'cover',
}: ImageProps) {
  const { styles } = useApp(useStyles)
  const { theme } = useTheme()
  const [loadingState, setLoadingState] = useState<LoadingState>('loading')

  // Determine URI and label
  const isImageReference = source && 'id' in source
  const uri = isImageReference ? source.url : source?.uri
  const effectiveLabel = label || (isImageReference ? source.label : undefined)
  const labelText = effectiveLabel ? effectiveLabel.substring(0, LABEL_MAX_LENGTH).toUpperCase() : ''

  const handleLoad = () => {
    setLoadingState('loaded')
    onLoad?.()
  }

  const handleError = () => {
    setLoadingState('error')
    onError?.()
  }

  if (!styles) return null

  const containerStyle = [styles.container, { width, height }, style]
  const dynamicLabelFontSize = Math.min(width ?? height ?? 50, height ?? width ?? 50) * LABEL_SIZE_RATIO

  // Fallback content
  const renderFallback = () => (
    <View style={styles.fallbackContainer}>
      <Text style={[styles.fallbackText, { fontSize: dynamicLabelFontSize }]}>
        {labelText || placeholder}
      </Text>
    </View>
  )

  // Error or missing source
  if (!source || !uri || loadingState === 'error') {
    return <View style={containerStyle}>{renderFallback()}</View>
  }

  return (
    <View style={containerStyle}>
      <ExpoImage
        source={{ uri }}
        style={styles.image}
        contentFit={resizeMode as ImageContentFit}
        transition={{ duration: 250 }}
        onLoad={handleLoad}
        onError={handleError}
      />

      {/* Loading indicator */}
      {loadingState === 'loading' && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
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
  loadingOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
}))


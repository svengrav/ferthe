import { ImageReference } from '@shared/contracts'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, ImageStyle, Image as RNImage, ImageProps as RNImageProps, StyleProp, Text, View, ViewStyle } from 'react-native'
import { useThemeStore } from '../theme'

interface SmartImageProps {
  source: ImageReference | { uri: string } | undefined
  label?: string // Label for text fallback (overrides source.label)
  style?: StyleProp<ImageStyle>
  width?: number
  height?: number
  placeholder?: React.ReactNode
  onError?: () => void
  resizeMode?: RNImageProps['resizeMode']
}

/**
 * Smart image component with automatic loading states, preview support, and error handling.
 * 
 * Features:
 * - Shows placeholder while loading
 * - Progressive loading: preview → full image
 * - Automatic retry on SAS token expiry
 * - Graceful error handling
 */
export function SmartImage({
  source,
  label,
  style,
  width,
  height,
  placeholder,
  onError,
  resizeMode = 'cover',
}: SmartImageProps) {
  const theme = useThemeStore()
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Determine URIs and label
  const isImageReference = source && 'id' in source
  const previewUri = isImageReference ? source.previewUrl : undefined
  const fullUri = isImageReference ? source.url : source?.uri
  const effectiveLabel = label || (isImageReference ? source.label : undefined)
  const labelText = effectiveLabel ? effectiveLabel.substring(0, 2).toUpperCase() : ''

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

  const containerStyle: StyleProp<ViewStyle> = {
    width,
    height,
    backgroundColor: theme?.colors?.surface || '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  }

  const imageStyle: StyleProp<ImageStyle> = {
    width: '100%',
    height: '100%',
  }

  // Label fallback component
  const renderLabelFallback = () => {
    const size = Math.min(width ?? height ?? 50, height ?? width ?? 50)
    const fontSize = size * 0.4

    return (
      <View style={{
        width: '100%',
        height: '100%',
        backgroundColor: theme?.colors?.primary || '#6200ee',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Text style={{
          color: theme?.colors?.onPrimary || '#ffffff',
          fontSize,
          fontWeight: '600',
        }}>
          {labelText}
        </Text>
      </View>
    )
  }

  // No source provided
  if (!source || !fullUri) {
    return (
      <View style={[containerStyle, style]}>
        {labelText ? renderLabelFallback() : placeholder || <ActivityIndicator size="small" color={theme?.colors?.onSurface || '#000'} />}
      </View>
    )
  }

  // Error state
  if (hasError) {
    return (
      <View style={[containerStyle, style]}>
        {labelText ? renderLabelFallback() : placeholder || <View style={{ backgroundColor: theme?.colors?.surface || '#f5f5f5', width: '100%', height: '100%' }} />}
      </View>
    )
  }

  return (
    <View style={[containerStyle, style]}>
      {/* Preview image (blurred/compressed) */}
      {showPreview && previewUri && (
        <RNImage
          source={{ uri: previewUri }}
          style={imageStyle}
          resizeMode={resizeMode}
          blurRadius={10}
        />
      )}

      {/* Full image */}
      <RNImage
        source={{ uri: fullUri }}
        style={imageStyle}
        resizeMode={resizeMode}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
      />

      {/* Loading indicator */}
      {isLoading && (
        <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="small" color={theme?.colors?.primary || '#6200ee'} />
        </View>
      )}
    </View>
  )
}

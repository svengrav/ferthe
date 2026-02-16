import { useWindowDimensions } from 'react-native'

/**
 * Standard aspect ratio for spot cards (portrait orientation)
 */
export const SPOT_ASPECT_RATIO = 3 / 2

/**
 * Image aspect ratio within spot cards
 */
export const SPOT_IMAGE_ASPECT_RATIO = 4 / 3

/**
 * Border radius for spot containers
 */
export const SPOT_BORDER_RADIUS = 18

/**
 * Border radius for images within spot containers
 */
export const SPOT_IMAGE_BORDER_RADIUS = 16

/**
 * Padding inside spot container frame
 */
export const SPOT_PADDING = 8

export type SpotVariant = 'marker' | 'grid' | 'card' | 'responsive'

interface UseSpotDimensionsOptions {
  variant?: SpotVariant
  withPadding?: boolean
  customWidth?: number
  customHeight?: number
}

interface SpotDimensions {
  width: number
  height: number
  imageWidth: number
  imageHeight: number
  borderRadius: number
  imageBorderRadius: number
  padding: number
}

/**
 * Hook to calculate consistent spot dimensions based on variant.
 * Ensures all spot components maintain the same aspect ratio.
 */
export function useSpotDimensions(options: UseSpotDimensionsOptions = {}): SpotDimensions {
  const { variant = 'responsive', withPadding = false, customWidth, customHeight } = options
  const { width: screenWidth } = useWindowDimensions()

  let width: number
  let height: number

  if (customWidth && customHeight) {
    width = customWidth
    height = customHeight
  } else if (variant === 'marker') {
    // Small map marker
    width = 40
    height = 40
  } else if (variant === 'grid') {
    // Grid layout - calculated by parent
    width = customWidth || 150
    height = (customWidth || 150) * SPOT_ASPECT_RATIO
  } else if (variant === 'card') {
    // Standard card size
    width = Math.min(screenWidth * 0.9, 400)
    height = width * SPOT_ASPECT_RATIO
  } else {
    // Responsive
    width = Math.min(screenWidth * 0.9, 400)
    height = width * SPOT_ASPECT_RATIO
  }

  const padding = withPadding ? SPOT_PADDING : 0
  const imageWidth = width - padding * 2
  const imageHeight = imageWidth * SPOT_IMAGE_ASPECT_RATIO

  return {
    width,
    height,
    imageWidth,
    imageHeight,
    borderRadius: SPOT_BORDER_RADIUS,
    imageBorderRadius: SPOT_IMAGE_BORDER_RADIUS,
    padding,
  }
}

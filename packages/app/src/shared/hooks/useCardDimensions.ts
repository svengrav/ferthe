import { useWindowDimensions } from 'react-native'

/**
 * Standard aspect ratio for card components (playing card format)
 * Value: 3/2 (height is 1.5x the width) → portrait orientation
 */
export const CARD_ASPECT_RATIO = 3 / 2

/**
 * Image aspect ratio within cards (portrait orientation)
 * Value: 4/3 (height is 1.33x the width) → portrait orientation
 */
export const CARD_IMAGE_ASPECT_RATIO = 4 / 3

/**
 * Maximum card width in pixels
 */
export const CARD_MAX_WIDTH = 400

/**
 * Card width as ratio of screen width
 */
export const CARD_WIDTH_RATIO = 0.9

/**
 * Border radius for card containers
 */
export const CARD_BORDER_RADIUS = 18

/**
 * Border radius for images within cards
 */
export const CARD_IMAGE_BORDER_RADIUS = 16

/**
 * Padding inside card frame
 */
export const CARD_PADDING = 8

/**
 * Card size variants
 */
export const CARD_VARIANTS = {
  small: 100,
  medium: 200,
  large: 300,
} as const

export type CardVariant = keyof typeof CARD_VARIANTS

interface UseCardDimensionsOptions {
  variant?: CardVariant | 'responsive'
  withPadding?: boolean
}

interface CardDimensions {
  // Calculated dimensions
  cardWidth: number
  cardHeight: number
  imageWidth: number
  imageHeight: number
  // Static constants (for convenience)
  aspectRatio: number
  imageAspectRatio: number
  borderRadius: number
  imageBorderRadius: number
  padding: number
  maxWidth: number
  widthRatio: number
}

/**
 * Hook to calculate consistent card dimensions across the app.
 * Ensures all cards maintain the same aspect ratio (playing card format).
 * 
 * @param options - Configuration for card dimensions
 * @param options.variant - Size variant: 'small', 'medium', 'large', or 'responsive' (default)
 * @param options.withPadding - Whether to account for internal padding (default: false)
 * @returns Consistent card and image dimensions plus all static constants
 */
export const useCardDimensions = (
  options: UseCardDimensionsOptions = {}
): CardDimensions => {
  const { variant = 'responsive', withPadding = false } = options
  const { width: screenWidth } = useWindowDimensions()

  let cardWidth: number

  if (variant === 'responsive') {
    // Responsive: based on screen width
    cardWidth = Math.min(screenWidth * CARD_WIDTH_RATIO, CARD_MAX_WIDTH)
  } else {
    // Fixed: based on variant
    cardWidth = CARD_VARIANTS[variant]
  }

  const cardHeight = cardWidth * CARD_ASPECT_RATIO

  // Calculate image dimensions with padding applied equally on all sides
  const padding = withPadding ? CARD_PADDING : 0
  const paddingTotal = padding * 2 // padding on both sides (left+right, top+bottom)

  const imageWidth = cardWidth - paddingTotal
  const imageHeight = cardHeight - paddingTotal

  // Inner border radius should be smaller to maintain visual consistency
  const imageBorderRadius = padding > 0 ? Math.max(CARD_BORDER_RADIUS - padding, 0) : CARD_IMAGE_BORDER_RADIUS

  return {
    // Calculated dimensions
    cardWidth,
    cardHeight,
    imageWidth,
    imageHeight,
    // Static constants (for convenience)
    aspectRatio: CARD_ASPECT_RATIO,
    imageAspectRatio: CARD_IMAGE_ASPECT_RATIO,
    borderRadius: CARD_BORDER_RADIUS,
    imageBorderRadius,
    padding: CARD_PADDING,
    maxWidth: CARD_MAX_WIDTH,
    widthRatio: CARD_WIDTH_RATIO,
  }
}

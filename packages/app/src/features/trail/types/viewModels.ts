import { ImageReference } from '@shared/contracts'

/**
 * View Models for Trail feature UI components.
 * These are screen-specific, composed types that merge domain data for presentation.
 */

/**
 * ViewModel for a single spot row in the trail spots list.
 * Combines spot data with discovery context and trail order.
 */
export interface TrailSpotRowVM {
  id: string
  order: number
  discovered: boolean
  title?: string
  image?: ImageReference
  blurredImage?: ImageReference
}

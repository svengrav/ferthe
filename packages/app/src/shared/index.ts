/**
 * Shared index file to export reusable components, hooks, and stores
 * This file serves as a central point for shared functionality across the app
 */

export * from './components'
export * from './localization'
export * from './navigation/Navigation'
export * from './stores/types'
export * from './theme'

// Hooks
export { useImagePicker } from './hooks/useImagePicker'
export { useImageUpload } from './hooks/useImageUpload'

// Stores
export { createReactionStore } from './stores/createReactionStore'
export type { ReactionSummary } from './stores/createReactionStore'


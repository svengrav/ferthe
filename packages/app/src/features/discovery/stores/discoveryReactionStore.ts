import { createReactionStore } from '@app/shared/stores/createReactionStore'

/**
 * Discovery-specific reaction store
 * Uses the generic reaction store factory
 */
const discoveryReactionStoreInstance = createReactionStore()

export const discoveryReactionStore = discoveryReactionStoreInstance.store
export const useDiscoveryReactionSummary = discoveryReactionStoreInstance.useReactionSummary
export const getDiscoveryReactionSummary = discoveryReactionStoreInstance.getReactionSummary
export const getDiscoveryReactionActions = discoveryReactionStoreInstance.getActions

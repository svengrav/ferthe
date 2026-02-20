import { Clue, DiscoverySpot, Trail } from '@shared/contracts'
import { createEventSystem } from '@shared/events/eventHandler'
import { DiscoveryEventState } from '../services/types'

export interface DiscoveryTrailState {
  createdAt?: Date
  trail: Trail | undefined
  scannedClues: Clue[]
  previewClues?: Clue[]
  spots: DiscoverySpot[]
}

type DiscoveryEvents = {
  /**
   * Emitted when the discovery trail is updated.
   * @param discoveryTrailUpdated The updated discovery trail state.
   */
  discoveryTrailUpdated: DiscoveryTrailState
  newDiscoveries: DiscoveryEventState[]
}

// Singleton instance of the discovery events system
let eventsInstance = createEventSystem<DiscoveryEvents>()

/**
 * Gets the discovery events system singleton instance
 */
export const getDiscoveryEvents = () => eventsInstance

// Typed event subscription methods
/**
 * Subscribe to discovery trail updates
 * @param handler Function that handles the discovery trail update event
 * @returns Unsubscribe function
 */
export const onDiscoveryTrailUpdated = (handler: (state: DiscoveryTrailState) => void): (() => void) => {
  return eventsInstance.on('discoveryTrailUpdated', handler)
}

/**
 * Subscribe to new discoveries events
 * @param handler Function that handles the new discoveries event
 * @returns Unsubscribe function
 */
export const onNewDiscoveries = (handler: (discoveries: DiscoveryEventState[]) => void): (() => void) => {
  return eventsInstance.on('newDiscoveries', handler)
}

// Typed event emission methods
/**
 * Emit a discovery trail updated event
 * @param state The updated discovery trail state
 */
export const emitDiscoveryTrailUpdated = (state: DiscoveryTrailState): void => {
  eventsInstance.emit('discoveryTrailUpdated', state)
}

/**
 * Emit a new discoveries event
 * @param discoveries The newly discovered items
 */
export const emitNewDiscoveries = (discoveries: DiscoveryEventState[]): void => {
  eventsInstance.emit('newDiscoveries', discoveries)
}

/**
 * Resets the discovery events system (primarily for testing purposes)
 */
export const resetDiscoveryEvents = () => {
  eventsInstance = createEventSystem<DiscoveryEvents>()
  return eventsInstance
}

import { useCallback, useEffect } from 'react'
import { logger } from '../utils/logger'

// Type alias for a callback function that is called on events
export type EventCallback<T extends any[]> = (...args: T) => void

// Type alias for an unsubscribe function
export type UnsubscribeFunction = () => void

// Type alias for a subscribe function that accepts a callback and returns an unsubscribe function
type SubscribeFunction<T extends any[]> = (callback: EventCallback<T>) => UnsubscribeFunction

/**
 * Hook for subscribing to event systems with automatic cleanup
 * @template T Type of arguments passed to the callback
 * @param subscribeFunction Function that registers a callback and returns an unsubscribe function
 * @param callback Function that is executed when the event is triggered
 * @param dependencies Optional array of dependencies for the callback
 */
export function useEvent<T extends any[]>(subscribeFunction: SubscribeFunction<T>, callback: EventCallback<T>, dependencies: any[] = []): void {
  // Memoize callback to ensure referential equality
  const memoizedCallback = useCallback(callback, dependencies)

  useEffect(() => {
    try {
      // Register and get unsubscribe function
      const unsubscribe = subscribeFunction(memoizedCallback)

      // Return cleanup function
      return unsubscribe
    } catch (error) {
      logger.error('Error in event subscription:', error)
    }
  }, [subscribeFunction, memoizedCallback])
}

/**
 * Creates a Promise that resolves when an event fires or rejects after timeout
 * @param subscribeFunction Function that subscribes to an event and returns an unsubscribe function
 * @param eventName Name of the event (for error messages)
 * @param timeoutMs Timeout in milliseconds
 * @param registerCleanup Optional function to register cleanup handlers
 * @returns Promise that resolves when the event fires or rejects on timeout
 */
export const waitForEvent = <T>(
  subscribeFunction: (handler: (data: T) => void) => () => void,
  eventName: string,
  timeoutMs = 2000,
  registerCleanup?: (cleanupFn: () => void) => void
): Promise<T> => {
  let timeoutId: any | null = null

  return new Promise<T>((resolve, reject) => {
    // Set up subscription
    const unsubscribe = subscribeFunction(data => {
      // Clear timeout when event fires
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      unsubscribe()
      resolve(data)
    })

    // Set up timeout
    timeoutId = setTimeout(() => {
      unsubscribe()
      reject(`Event ${eventName} not fired within timeout of ${timeoutMs}ms`)
    }, timeoutMs)

    // Make sure timeout is cleared when test is done
    if (registerCleanup) {
      registerCleanup(() => {
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        unsubscribe()
      })
    }
  })
}

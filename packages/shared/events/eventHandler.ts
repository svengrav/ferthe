export type EventCallback<Payload> = (payload: Payload) => void
export type Unsubscribe = () => void

export const createEventSystem = <Events extends Record<string, any>>() => {
  const listeners: { [K in keyof Events]?: Set<EventCallback<Events[K]>> } = {}

  return {
    on<K extends keyof Events>(event: K, callback: EventCallback<Events[K]>): Unsubscribe {
      if (!listeners[event]) {
        listeners[event] = new Set()
      }
      listeners[event]!.add(callback)

      // Return unsubscribe function
      return () => {
        listeners[event]?.delete(callback)
      }
    },
    off<K extends keyof Events>(event: K, callback: EventCallback<Events[K]>) {
      listeners[event]?.delete(callback)
    },
    emit<K extends keyof Events>(event: K, payload: Events[K]) {
      listeners[event]?.forEach(cb => cb(payload))
    },
  }
}

import type { StateStorage } from 'zustand/middleware'
import type { SecureStoreConnector } from './secureStoreConnector'

/**
 * Adapter to make SecureStoreConnector compatible with Zustand persist middleware
 */
export function createStateStorage(connector: SecureStoreConnector): StateStorage {
  return {
    getItem: async (name: string): Promise<string | null> => {
      const value = await connector.read<string>(name)
      return value
    },
    setItem: async (name: string, value: string): Promise<void> => {
      await connector.write(name, value)
    },
    removeItem: async (name: string): Promise<void> => {
      await connector.delete(name)
    },
  }
}

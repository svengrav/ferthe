import { createCuid2 } from '@core/utils/idGenerator.ts'
import { StoreInterface, StoreItem } from './storeInterface.ts'
import console from 'console';

/**
 * Creates a memory storage implementation using the unified StoreInterface
 * @param containerName Unique identifier for this storage instance
 */
export const createMemoryStore = (): StoreInterface => {
  const MEMORY_STORAGE: Record<string, unknown[]> = {}

  const ensureContainerInitialized = (container: string) => {
    if (!MEMORY_STORAGE[container]) {
      MEMORY_STORAGE[container] = []
    }
  }

  return {
    async create<T extends StoreItem>(container: string, item: T): Promise<T> {
      try {
        ensureContainerInitialized(container)
        const items = MEMORY_STORAGE[container] as T[]

        // Ensure unique ID if not provided
        if (!item.id) {
          item = { ...item, id: createCuid2() }
        }

        // Check for duplicate ID
        if (items.find(existingItem => existingItem.id === item.id)) {
          throw new Error(`Item with id ${item.id} already exists`)
        }

        const newItems = [...items, item]
        MEMORY_STORAGE[container] = newItems
        return { ...item }
      } catch (error) {
        console.error(`Error creating item in memory storage (${container}):`, error)
        throw error
      }
    },

    async get<T extends StoreItem>(container: string, id: string): Promise<T | undefined> {
      try {
        ensureContainerInitialized(container)
        const items = MEMORY_STORAGE[container] as T[]
        return items.find(item => item.id === id) || undefined
      } catch (error) {
        console.error(`Error getting item from memory storage (${container}):`, error)
        return undefined
      }
    },

    async list<T>(container: string, query?: string, parameters?: Array<{ name: string; value: any }>): Promise<T[]> {
      try {
        ensureContainerInitialized(container)
        const items = [...(MEMORY_STORAGE[container] as T[])]

        // Simple query support for memory store (basic filtering)
        if (query && query !== 'SELECT * FROM c') {
          console.warn(`Advanced queries not supported in memory store: ${query}`)
        }

        return items
      } catch (error) {
        console.error(`Error listing items from memory storage (${container}):`, error)
        return []
      }
    },

    async update<T extends StoreItem>(container: string, id: string, item: Partial<T>): Promise<T | undefined> {
      try {
        ensureContainerInitialized(container)
        const items = MEMORY_STORAGE[container] as T[]
        const index = items.findIndex(existingItem => existingItem.id === id)

        if (index === -1) {
          return undefined
        }

        const updatedItem = { ...items[index], ...item } as T
        const newItems = [...items]
        newItems[index] = updatedItem
        MEMORY_STORAGE[container] = newItems

        return { ...updatedItem }
      } catch (error) {
        console.error(`Error updating item in memory storage (${container}):`, error)
        throw error
      }
    },

    async delete(container: string, id: string): Promise<void> {
      try {
        ensureContainerInitialized(container)

        const items = MEMORY_STORAGE[container] as StoreItem[]
        const newItems = items.filter(item => item.id !== id)
        MEMORY_STORAGE[container] = newItems
      } catch (error) {
        console.error(`Error deleting item from memory storage (${container}):`, error)
        throw error
      }
    },

    async deleteAll(container: string): Promise<void> {
      try {
        ensureContainerInitialized(container)
        MEMORY_STORAGE[container] = []
      } catch (error) {
        console.error(`Error deleting all items from memory storage (${container}):`, error)
        throw error
      }
    },
  }
}

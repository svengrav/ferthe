import { createCosmosConnector } from '@core/connectors/cosmos/cosmosConnector.ts'
import { QueryOptions } from '@shared/contracts/index.ts'
import { buildCosmosQuery } from './queryUtils.ts'
import { ListResult, StoreInterface, StoreItem } from './storeInterface.ts'

interface CosmosStoreOptions {
  connectionString?: string
  database?: string
}

/**
 * Creates a cosmos store implementation for a given type
 */
export function createCosmosStore(options?: CosmosStoreOptions): StoreInterface {
  if (!options || !options.connectionString || !options.database) {
    throw new Error('Cosmos store requires connectionString and database options')
  }
  const connector = createCosmosConnector({
    connectionString: options.connectionString,
    database: options.database,
  })

  return {
    async create<T extends StoreItem>(container: string, item: T): Promise<T> {
      try {
        return await connector.createItem<T>(container, item)
      } catch (error) {
        console.error(`Error creating item in ${container}:`, error)
        throw error
      }
    },

    async get<T extends StoreItem>(container: string, id: string): Promise<T | undefined> {
      try {
        return await connector.getItem<T>(container, id, id)
      } catch (error) {
        console.error(`Error getting item from ${container}:`, error)
        return undefined
      }
    },

    async list<T extends StoreItem>(container: string, options?: QueryOptions): Promise<ListResult<T>> {
      try {
        // Get all filtered items (without pagination) to compute total
        const { query: allQuery, parameters: allParams } = buildCosmosQuery({ ...options, limit: undefined })
        const allItems = await connector.queryItems<T>(container, allQuery, allParams)
        const total = allItems.length
        // Apply cursor pagination
        const cursor = options?.cursor
        const limit = options?.limit
        let startIndex = 0
        if (cursor) {
          const cursorIndex = allItems.findIndex(item => item.id === cursor)
          startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0
        }
        const data = limit !== undefined
          ? allItems.slice(startIndex, startIndex + limit)
          : allItems.slice(startIndex)
        const nextCursor = limit !== undefined && startIndex + limit < total
          ? data[data.length - 1]?.id
          : undefined
        return { data, total, nextCursor }
      } catch (error) {
        console.error(`Error listing items from ${container}:`, error)
        return { data: [], total: 0 }
      }
    },
    async update<T extends StoreItem>(container: string, id: string, item: Partial<T>): Promise<T | undefined> {
      try {
        const existing = await this.get(container, id)
        if (!existing) {
          return undefined
        }

        const updated = { ...existing, ...item } as T
        return await connector.replaceItem<T>(container, id, id, updated)
      } catch (error) {
        console.error(`Error updating item in ${container}:`, error)
        throw error
      }
    },

    async delete(container: string, id: string): Promise<void> {
      try {
        await connector.deleteItem(container, id, id)
      } catch (error) {
        console.error(`Error deleting item from ${container}:`, error)
        throw error
      }
    },

    async deleteAll(container: string): Promise<void> {
      try {
        const { data: items } = await this.list(container)
        await Promise.all(items.map(item => this.delete(container, item.id)))
      } catch (error) {
        console.error(`Error deleting all items from ${container}:`, error)
        throw error
      }
    },
  }
}

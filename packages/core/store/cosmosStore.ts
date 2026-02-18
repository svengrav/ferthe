import { createCosmosConnector } from '@core/connectors/cosmos/cosmosConnector.ts'
import { QueryOptions } from '@shared/contracts/index.ts'
import { buildCosmosQuery } from './queryUtils.ts'
import { StoreInterface, StoreItem } from './storeInterface.ts'

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

    async list<T extends StoreItem>(container: string, options?: QueryOptions): Promise<T[]> {
      try {
        const { query, parameters } = buildCosmosQuery(options)
        return await connector.queryItems<T>(container, query, parameters)
      } catch (error) {
        console.error(`Error listing items from ${container}:`, error)
        return []
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
        const items = await this.list(container)
        await Promise.all(items.map(item => this.delete(container, item.id)))
      } catch (error) {
        console.error(`Error deleting all items from ${container}:`, error)
        throw error
      }
    },
  }
}

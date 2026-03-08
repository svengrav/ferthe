import { QueryOptions } from '@shared/contracts/index.ts'
import { createAzureTableConnector, AzureTableConnector } from '@core/connectors/azureTableConnector.ts'
import { StoreInterface, StoreItem } from './storeInterface.ts'
import { logger } from '@core/shared/logger.ts'

interface AzureTableStoreOptions {
  connectionString: string
}

/**
 * Creates an Azure Table Storage implementation
 * Note: Complex queries are filtered in-memory due to Table Storage limitations
 */
export function createAzureTableStore(options: AzureTableStoreOptions): StoreInterface {
  if (!options?.connectionString) {
    throw new Error('Azure Table Store requires connectionString option')
  }

  const connector = createAzureTableConnector(options.connectionString)

  function buildTableFilter(options?: QueryOptions): string | undefined {
    if (!options || !options.filters) return undefined

    const filters: string[] = []

    // Basic property filters (Table Storage supports simple comparisons)
    for (const [key, value] of Object.entries(options.filters)) {
      if (typeof value === 'string') {
        filters.push(`${key} eq '${value}'`)
      } else if (typeof value === 'number') {
        filters.push(`${key} eq ${value}`)
      } else if (typeof value === 'boolean') {
        filters.push(`${key} eq ${value}`)
      }
    }

    return filters.length > 0 ? filters.join(' and ') : undefined
  }

  function applyInMemoryFilters<T extends StoreItem>(items: T[], options?: QueryOptions): T[] {
    let result = [...items]

    // Sorting
    if (options?.sortBy) {
      const field = options.sortBy
      const direction = options.sortOrder || 'asc'
      result.sort((a: any, b: any) => {
        const aVal = a[field]
        const bVal = b[field]
        if (aVal < bVal) return direction === 'asc' ? -1 : 1
        if (aVal > bVal) return direction === 'asc' ? 1 : -1
        return 0
      })
    }

    // Pagination
    if (options?.limit !== undefined) {
      const offset = options.offset || 0
      result = result.slice(offset, offset + options.limit)
    }

    return result
  }

  return {
    async create<T extends StoreItem>(container: string, item: T): Promise<T> {
      try {
        return await connector.createItem<T>(container, item)
      } catch (error) {
        logger.error(`Error creating item in ${container}:`, error)
        throw error
      }
    },

    async get<T extends StoreItem>(container: string, id: string): Promise<T | undefined> {
      try {
        return await connector.getItem<T>(container, id)
      } catch (error) {
        logger.error(`Error getting item from ${container}:`, error)
        return undefined
      }
    },

    async list<T extends StoreItem>(container: string, options?: QueryOptions): Promise<T[]> {
      try {
        const filter = buildTableFilter(options)
        const items = await connector.queryItems<T>(container, filter)

        // Apply in-memory filters for sorting, pagination, etc.
        return applyInMemoryFilters(items, options)
      } catch (error) {
        logger.error(`Error listing items from ${container}:`, error)
        return []
      }
    },

    async update<T extends StoreItem>(container: string, id: string, item: Partial<T>): Promise<T | undefined> {
      try {
        const existing = await this.get<T>(container, id)
        if (!existing) {
          return undefined
        }

        const updated = { ...existing, ...item } as T
        return await connector.replaceItem<T>(container, id, updated)
      } catch (error) {
        logger.error(`Error updating item in ${container}:`, error)
        throw error
      }
    },

    async delete(container: string, id: string): Promise<void> {
      try {
        await connector.deleteItem(container, id)
      } catch (error) {
        logger.error(`Error deleting item from ${container}:`, error)
        throw error
      }
    },

    async deleteAll(container: string): Promise<void> {
      try {
        const items = await this.list(container)
        await Promise.all(items.map(item => this.delete(container, item.id)))
      } catch (error) {
        logger.error(`Error deleting all items from ${container}:`, error)
        throw error
      }
    },
  }
}

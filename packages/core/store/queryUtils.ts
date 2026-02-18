import { QueryOptions } from '@shared/contracts/index.ts'

/**
 * Apply query options (filter, sort, pagination) to an array of items
 */
export function applyQueryOptions<T extends Record<string, any>>(
  items: T[],
  options?: QueryOptions
): T[] {
  if (!options) return items

  let result = [...items]

  // Apply filters
  if (options.filters) {
    result = result.filter(item => {
      return Object.entries(options.filters!).every(([key, value]) => {
        if (value === undefined || value === null) return true

        // Support nested property access (e.g., 'user.id')
        const itemValue = key.split('.').reduce((obj, k) => obj?.[k], item as any)

        // Array contains check
        if (Array.isArray(value)) {
          return value.includes(itemValue)
        }

        // Exact match
        return itemValue === value
      })
    })
  }

  // Apply search (searches all string fields)
  if (options.search) {
    const searchLower = options.search.toLowerCase()
    result = result.filter(item => {
      return Object.values(item).some(value => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchLower)
        }
        return false
      })
    })
  }

  // Apply sorting
  if (options.sortBy) {
    const sortOrder = options.sortOrder || 'asc'
    result.sort((a, b) => {
      const aValue = options.sortBy!.split('.').reduce((obj, k) => obj?.[k], a as any)
      const bValue = options.sortBy!.split('.').reduce((obj, k) => obj?.[k], b as any)

      if (aValue === bValue) return 0

      const comparison = aValue < bValue ? -1 : 1
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }

  // Apply pagination
  const offset = options.offset || 0
  const limit = options.limit

  if (limit !== undefined) {
    result = result.slice(offset, offset + limit)
  } else if (offset > 0) {
    result = result.slice(offset)
  }

  return result
}

/**
 * Convert QueryOptions to Cosmos DB SQL query
 */
export function buildCosmosQuery(options?: QueryOptions): {
  query: string
  parameters: Array<{ name: string; value: any }>
} {
  if (!options) {
    return { query: 'SELECT * FROM c', parameters: [] }
  }

  const parts: string[] = ['SELECT * FROM c']
  const parameters: Array<{ name: string; value: any }> = []
  const conditions: string[] = []

  // Build WHERE clause from filters
  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value], index) => {
      if (value !== undefined && value !== null) {
        const paramName = `@param${index}`

        if (Array.isArray(value)) {
          // IN clause for arrays
          conditions.push(`c.${key} IN (${value.map((_, i) => `@param${index}_${i}`).join(', ')})`)
          value.forEach((v: any, i: number) => {
            parameters.push({ name: `@param${index}_${i}`, value: v })
          })
        } else {
          conditions.push(`c.${key} = ${paramName}`)
          parameters.push({ name: paramName, value })
        }
      }
    })
  }

  // Add search condition (searches all string fields - simplified)
  if (options.search) {
    // Note: Full-text search in Cosmos DB is limited, this is a basic implementation
    console.warn('Search is not fully optimized for Cosmos DB, consider using Azure Cognitive Search')
  }

  if (conditions.length > 0) {
    parts.push(`WHERE ${conditions.join(' AND ')}`)
  }

  // ORDER BY
  if (options.sortBy) {
    const order = options.sortOrder?.toUpperCase() || 'ASC'
    parts.push(`ORDER BY c.${options.sortBy} ${order}`)
  }

  // OFFSET LIMIT
  if (options.offset !== undefined && options.limit !== undefined) {
    parts.push(`OFFSET ${options.offset} LIMIT ${options.limit}`)
  } else if (options.limit !== undefined) {
    parts.push(`OFFSET 0 LIMIT ${options.limit}`)
  }

  return {
    query: parts.join(' '),
    parameters,
  }
}

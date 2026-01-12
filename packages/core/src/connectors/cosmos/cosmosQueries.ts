import { cosmosConnector } from './cosmosConnector'
import { createQuery } from './cosmosQueryBuilder'

/**
 * Gets a single item by ID and account ID
 */
async function getItemByIdAndAccount<T>(containerName: string, id: string, accountId: string): Promise<T | null> {
  const { query, params } = createQuery().whereEqual('id', id).whereEqual('accountId', accountId).build()

  const items = await cosmosConnector.queryItems<T>(containerName, query, params)
  return items.length > 0 ? items[0] : null
}

/**
 * Lists items with pagination filtered by account ID
 */
async function listItemsByAccount<T>(
  containerName: string,
  accountId: string,
  options: { limit?: number; offset?: number; orderBy?: string; direction?: 'ASC' | 'DESC' } = {}
): Promise<{ items: T[]; total: number; limit: number; offset: number }> {
  const { limit = 10, offset = 0, orderBy = '_ts', direction = 'DESC' } = options

  // Get total count
  const countResult = await cosmosConnector.queryItems<number>(
    containerName,
    'SELECT VALUE COUNT(1) FROM c WHERE c.accountId = @accountId',
    [{ name: '@accountId', value: accountId }]
  )
  const total = countResult[0] || 0

  // Get items with pagination
  const queryBuilder = createQuery()
    .whereEqual('accountId', accountId)
    .orderBy(orderBy, direction)
    .offset(offset)
    .limit(limit)

  const items = await cosmosConnector.queryItems<T>(
    containerName,
    queryBuilder.build().query,
    queryBuilder.build().params
  )

  return {
    items,
    total,
    limit,
    offset,
  }
}

/**
 * Counts items that match the provided filters
 */
async function countItems(containerName: string, conditions: { [key: string]: any }): Promise<number> {
  const queryBuilder = createQuery().select('VALUE COUNT(1)')

  Object.entries(conditions).forEach(([key, value]) => {
    queryBuilder.whereEqual(key, value)
  })

  const result = await cosmosConnector.queryItems<number>(
    containerName,
    queryBuilder.build().query,
    queryBuilder.build().params
  )

  return result[0] || 0
}

/**
 * Gets items with multiple filter conditions
 */
async function getItemsByConditions<T>(
  containerName: string,
  conditions: { [key: string]: any },
  options: {
    limit?: number
    offset?: number
    orderBy?: string
    direction?: 'ASC' | 'DESC'
  } = {}
): Promise<T[]> {
  const { limit, offset, orderBy = '_ts', direction = 'DESC' } = options

  const queryBuilder = createQuery()

  // Add all conditions
  Object.entries(conditions).forEach(([key, value]) => {
    queryBuilder.whereEqual(key, value)
  })

  // Add ordering
  if (orderBy) {
    queryBuilder.orderBy(orderBy, direction)
  }

  // Add pagination if specified
  if (offset !== undefined) {
    queryBuilder.offset(offset)
  }

  if (limit !== undefined) {
    queryBuilder.limit(limit)
  }
  console.log('Query:', queryBuilder.build().query)
  return await cosmosConnector.queryItems<T>(containerName, queryBuilder.build().query, queryBuilder.build().params)
}

/**
 * Gets a paginated list with specified conditions
 */
async function listItemsWithPagination<T>(
  containerName: string,
  conditions: { [key: string]: any },
  options: {
    limit?: number
    offset?: number
    orderBy?: string
    direction?: 'ASC' | 'DESC'
  } = {}
): Promise<{ items: T[]; total: number; limit: number; offset: number }> {
  const { limit = 10, offset = 0, orderBy = '_ts', direction = 'DESC' } = options

  const total = await countItems(containerName, conditions)
  const items = await getItemsByConditions<T>(containerName, conditions, {
    limit,
    offset,
    orderBy,
    direction,
  })

  return {
    items,
    total,
    limit,
    offset,
  }
}

/**
 * Verifies item ownership by account ID before processing
 */
async function verifyAndProcess<T extends { id: string }>(
  containerName: string,
  accountId: string,
  id: string,
  processor: (item: T) => Promise<void>
): Promise<boolean> {
  const item = await getItemByIdAndAccount<T>(containerName, id, accountId)

  if (!item) {
    return false
  }

  await processor(item)
  return true
}

/**
 * Selects a single item based on specified conditions
 * Returns null if no item is found
 */
async function selectSingleItem<T>(
  containerName: string,
  conditions: { [key: string]: any },
  options: {
    orderBy?: string
    direction?: 'ASC' | 'DESC'
  } = {}
): Promise<T | null> {
  const items = await getItemsByConditions<T>(containerName, conditions, {
    limit: 1,
    orderBy: options.orderBy || '_ts',
    direction: options.direction || 'DESC',
  })

  return items.length > 0 ? items[0] : null
}

export const cosmosQueries = {
  getItemByIdAndAccount,
  listItemsByAccount,
  countItems,
  getItemsByConditions,
  listItemsWithPagination,
  verifyAndProcess,
  selectSingleItem,
}

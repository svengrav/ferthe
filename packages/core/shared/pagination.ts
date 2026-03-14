import { QueryOptions, Result } from '@shared/contracts/index.ts'

export interface PageResult<T> {
  data: T[]
  meta: { total: number; hasMore: boolean; limit?: number; nextCursor?: string }
}

/**
 * Applies cursor-based pagination to an in-memory array.
 *
 * @param items   - The full sorted/filtered array to paginate.
 * @param options - QueryOptions containing limit and optional cursor.
 * @param getKey  - Extracts the cursor key from an item (default: item.id).
 */
export function paginateWithCursor<T>(
  items: T[],
  options: QueryOptions | undefined,
  getKey: (item: T) => string = (item: any) => item.id
): PageResult<T> {
  const total = items.length
  const { cursor, limit } = options ?? {}

  let startIndex = 0
  if (cursor) {
    const idx = items.findIndex(item => getKey(item) === cursor)
    startIndex = idx >= 0 ? idx + 1 : 0
  }

  const paged = limit !== undefined
    ? items.slice(startIndex, startIndex + limit)
    : items.slice(startIndex)

  const lastItem = paged[paged.length - 1]
  const nextCursor = limit !== undefined && startIndex + limit < total && lastItem
    ? getKey(lastItem)
    : undefined

  return { data: paged, meta: { total, hasMore: nextCursor !== undefined, limit, nextCursor } }
}

/**
 * Wraps paginateWithCursor into a success Result.
 */
export function paginateResult<T>(
  items: T[],
  options: QueryOptions | undefined,
  getKey?: (item: T) => string
): Result<T[]> {
  const { data, meta } = paginateWithCursor(items, options, getKey)
  return { success: true, data, meta }
}

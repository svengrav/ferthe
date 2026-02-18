import type { QueryOptions } from '@shared/contracts/results.ts'

/**
 * Parses flat URL query parameters into a typed QueryOptions object.
 * Handles type conversions: limit/offset → number, include/exclude → comma-separated arrays.
 * Domain-specific params (e.g. trailId) are ignored — only QueryOptions fields are extracted.
 */
export const parseQueryOptions = (query?: Record<string, string>): QueryOptions | undefined => {
  if (!query) return undefined

  const options: Record<string, unknown> = {}
  let hasOptions = false

  if (query.limit) { options.limit = parseInt(query.limit, 10); hasOptions = true }
  if (query.offset) { options.offset = parseInt(query.offset, 10); hasOptions = true }
  if (query.sortBy) { options.sortBy = query.sortBy; hasOptions = true }
  if (query.sortOrder === 'asc' || query.sortOrder === 'desc') { options.sortOrder = query.sortOrder; hasOptions = true }
  if (query.search) { options.search = query.search; hasOptions = true }
  if (query.include) { options.include = query.include.split(','); hasOptions = true }
  if (query.exclude) { options.exclude = query.exclude.split(','); hasOptions = true }

  return hasOptions ? options as QueryOptions : undefined
}

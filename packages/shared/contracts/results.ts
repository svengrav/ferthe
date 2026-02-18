/**
 * It defines the structure for standardized API results and error handling.
 */

import { ERROR_CODES, type ApiErrorCode } from './errors.ts'

/**
 * Represents the result of an API operation.
 * Includes success status, data, error details, and optional metadata.
 */
export interface Result<T> {
  readonly success?: boolean
  readonly error?: ErrorResult
  readonly message?: string
  readonly meta?: {
    readonly timestamp?: string
    readonly total?: number // Total count for pagination
    readonly hasMore?: boolean // More results available
    readonly limit?: number
    readonly offset?: number
  }
  data?: T
}

export interface ErrorResult {
  message: string
  code: string
  context?: string
  details?: Record<string, any>
}

/**
 * Query options for list operations
 * 
 * Enrichment Groups (for include/exclude):
 * - 'images': Generate fresh SAS-token URLs for all image fields (costly: ~50-200ms per image)
 * - 'userStatus': Add user-specific status and filter data accordingly (requires extra DB query)
 */
export interface QueryOptions {
  // Pagination
  readonly limit?: number
  readonly offset?: number

  // Sorting
  readonly sortBy?: string
  readonly sortOrder?: 'asc' | 'desc'

  // Filtering
  readonly filters?: Record<string, any>
  readonly search?: string

  // Field selection (for enrichment control)
  // - If not specified: all enrichments are applied (default)
  // - If include is set: only specified enrichments are applied
  // - If exclude is set: all except excluded enrichments are applied
  readonly include?: string[]
  readonly exclude?: string[]
}

/**
 * Create a successful result with data
 */
export function createSuccessResult<T>(data: T): Result<T> {
  return {
    success: true,
    data,
  }
}

/**
 * Create an error result with code and optional details
 */
export function createErrorResult<T = any>(code: ApiErrorCode, details?: Record<string, any>): Result<T> {
  const errorCodes = ERROR_CODES[code]
  return {
    success: false,
    error: {
      code: errorCodes.code,
      message: errorCodes.message,
      details,
    },
  }
}

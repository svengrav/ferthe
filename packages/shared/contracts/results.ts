/**
 * It defines the structure for standardized API results and error handling.
 */

import type { ApiErrorCode } from './errors.ts'

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
  }
  data?: T
}

export interface ErrorResult {
  message: string
  code: string
  context?: string
  details?: Record<string, any>
}

// interface Options {
//   // Pagination
//   readonly hasMore?: boolean
//   readonly limit?: number
//   readonly offset?: number

//   // Sorting
//   readonly sortBy?: string
//   readonly sortOrder?: 'asc' | 'desc'

//   // Filtering & Search
//   readonly filters?: Record<string, any>
//   readonly search?: string

//   // Field selection
//   readonly include?: string[]
//   readonly exclude?: string[]
// }

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
  return {
    success: false,
    error: {
      code,
      message: code, // Can be enhanced with error message mapping
      details,
    },
  }
}

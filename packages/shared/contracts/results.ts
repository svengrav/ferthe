/**
 * Result and error handling types for API operations
 */

import { z } from 'zod'
import { ERROR_CODES, type ApiErrorCode } from './errors.ts'

// ──────────────────────────────────────────────────────────────
// Zod Schemas
// ──────────────────────────────────────────────────────────────

export const ErrorResultSchema = z.object({
  message: z.string(),
  code: z.string(),
  context: z.string().optional(),
  details: z.record(z.string(), z.any()).optional(),
})

export const ResultMetaSchema = z.object({
  timestamp: z.string().optional(),
  total: z.number().optional(), // Total count for pagination
  hasMore: z.boolean().optional(), // More results available
  limit: z.number().optional(),
  offset: z.number().optional(),
})

export const ResultSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean().optional(),
    error: ErrorResultSchema.optional(),
    message: z.string().optional(),
    meta: ResultMetaSchema.optional(),
    data: dataSchema.optional(),
  })

export const QueryOptionsSchema = z.object({
  // Pagination
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),

  // Sorting
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),

  // Filtering
  filters: z.record(z.string(), z.any()).optional(),
  search: z.string().optional(),

  // Enrichment Groups
  include: z.array(z.string()).optional(), // Enrichment groups to include (e.g., ['images', 'userStatus'])
  exclude: z.array(z.string()).optional(), // Enrichment groups to exclude
})

// ──────────────────────────────────────────────────────────────
// TypeScript Types (Inferred from Zod)
// ──────────────────────────────────────────────────────────────

export type ErrorResult = z.infer<typeof ErrorResultSchema>

/**
 * Represents the result of an API operation.
 * Includes success status, data, error details, and optional metadata.
 */
export interface Result<T> {
  readonly success?: boolean
  readonly error?: ErrorResult
  readonly message?: string
  readonly meta?: z.infer<typeof ResultMetaSchema>
  data?: T
}

/**
 * Query options for list operations
 * 
 * Enrichment Groups (for include/exclude):
 * - 'images': Generate fresh SAS-token URLs for all image fields (costly: ~50-200ms per image)
 * - 'userStatus': Add user-specific status and filter data accordingly (requires extra DB query)
 */
export type QueryOptions = z.infer<typeof QueryOptionsSchema>

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

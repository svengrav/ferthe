/**
 * Zod Validation Middleware for API Routes
 * Provides runtime validation for request bodies, params, and query parameters
 */

import { Result } from '@shared/contracts/results.ts'
import { z } from 'zod'

/**
 * Validation schemas for a route
 */
export interface RouteSchemas<TBody = any, TParams = any, TQuery = any> {
  body?: z.ZodType<TBody>
  params?: z.ZodType<TParams>
  query?: z.ZodType<TQuery>
}

/**
 * Validation result
 */
export interface ValidationResult<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
}

/**
 * Validate data against a Zod schema
 */
export function validate<T>(schema: z.ZodType<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data)

  if (result.success) {
    return {
      success: true,
      data: result.data,
    }
  }

  return {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: formatZodError(result.error),
      details: result.error.format(),
    },
  }
}

/**
 * Format Zod error messages for user-friendly output
 */
function formatZodError(error: z.ZodError): string {
  const formatted = error.flatten()
  const messages: string[] = []

  // Field errors
  if (formatted.fieldErrors) {
    Object.entries(formatted.fieldErrors).forEach(([field, errorList]) => {
      if (errorList && Array.isArray(errorList) && errorList.length > 0) {
        messages.push(`${field}: ${errorList.join(', ')}`)
      }
    })
  }

  // Form errors
  if (formatted.formErrors && Array.isArray(formatted.formErrors) && formatted.formErrors.length > 0) {
    messages.push(...formatted.formErrors)
  }

  return messages.length > 0 ? messages.join('; ') : 'Validation failed'
}

/**
 * Validate request data (body, params, query) against schemas
 */
export function validateRequest<TBody = any, TParams = any, TQuery = any>(
  data: {
    body?: unknown
    params?: unknown
    query?: unknown
  },
  schemas: RouteSchemas<TBody, TParams, TQuery>
): Result<{ body?: TBody; params?: TParams; query?: TQuery }> {
  const validated: { body?: TBody; params?: TParams; query?: TQuery } = {}

  // Validate body
  if (schemas.body && data.body !== undefined) {
    const bodyResult = validate(schemas.body, data.body)
    if (!bodyResult.success) {
      return {
        success: false,
        error: bodyResult.error!,
      }
    }
    validated.body = bodyResult.data
  }

  // Validate params
  if (schemas.params && data.params !== undefined) {
    const paramsResult = validate(schemas.params, data.params)
    if (!paramsResult.success) {
      return {
        success: false,
        error: paramsResult.error!,
      }
    }
    validated.params = paramsResult.data
  }

  // Validate query
  if (schemas.query && data.query !== undefined) {
    const queryResult = validate(schemas.query, data.query)
    if (!queryResult.success) {
      return {
        success: false,
        error: queryResult.error!,
      }
    }
    validated.query = queryResult.data
  }

  return {
    success: true,
    data: validated,
  }
}

/**
 * Type guard to check if result is a validation error
 */
export function isValidationError(result: Result<any>): boolean {
  return !result.success && result.error?.code === 'VALIDATION_ERROR'
}

/**
 * Create a validated handler wrapper
 */
export function withValidation<TBody = any, TParams = any, TQuery = any>(
  schemas: RouteSchemas<TBody, TParams, TQuery>
) {
  return <T>(
    handler: (validated: {
      body?: TBody
      params?: TParams
      query?: TQuery
      context: any
    }) => Promise<Result<T>>
  ) => {
    return async (request: any): Promise<Result<T>> => {
      // Validate request
      const validationResult = validateRequest(
        {
          body: request.body,
          params: request.params,
          query: request.query,
        },
        schemas
      )

      if (!validationResult.success) {
        return validationResult as Result<T>
      }

      // Call handler with validated data
      return handler({
        ...validationResult.data!,
        context: request.context,
      })
    }
  }
}

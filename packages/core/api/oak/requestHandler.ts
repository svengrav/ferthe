import { AccountApplicationActions } from '@core/features/account/accountApplication.ts'
import { ERROR_CODES, Result } from '@shared/contracts/'
import { Context } from 'oak'
import { AuthContext, createAuthMiddleware, createPublicContext } from './authMiddleware.ts'
import type { OakRouteHandler } from './types.ts'
import { validateRequest, type RouteSchemas } from './validation.ts'

type RequestOptions<Params, Body, Query> = {
  context: AuthContext
  params?: Params
  body?: Body
  query?: Query
}

type HandlerFunction<T, Params, Body, Query> = (request: RequestOptions<Params, Body, Query>) => Promise<Result<T>>

/**
 * Options for request handler with optional Zod validation
 */
interface RequestHandlerOptions<TBody = any, TParams = any, TQuery = any> {
  /** Zod schemas for validation */
  schemas?: RouteSchemas<TBody, TParams, TQuery>
}

/**
 * Factory to create request handler with account application access
 */
export const createAsyncRequestHandler = (accountApplication: AccountApplicationActions) => {
  const authMiddleware = createAuthMiddleware(accountApplication)

  /**
   * Creates an async request handler for Oak routes with optional Zod validation.
   * - <T = Result Type, TParams = Request Parameters, TBody = Request Body, TQuery = Request Query>
   */
  // deno-lint-ignore no-explicit-any
  return <T = any, TParams = any, TBody = any, TQuery = any>(
    handlerOrOptions: HandlerFunction<T, TParams, TBody, TQuery> | RequestHandlerOptions<TBody, TParams, TQuery>,
    maybeHandler?: HandlerFunction<T, TParams, TBody, TQuery>
  ): OakRouteHandler => {
    // Determine if using validation or not
    let handler: HandlerFunction<T, TParams, TBody, TQuery>
    let options: RequestHandlerOptions<TBody, TParams, TQuery> | undefined

    if (typeof handlerOrOptions === 'function') {
      handler = handlerOrOptions
      options = undefined
    } else {
      handler = maybeHandler!
      options = handlerOrOptions
    }

    return async (ctx: Context, params: Record<string, string>, isPublic: boolean) => {
      try {
        let authContext: AuthContext

        if (isPublic) {
          authContext = createPublicContext()
        } else {
          const authHeader = ctx.request.headers.get('Authorization')
          const authResult = await authMiddleware.authenticateBearer(authHeader)
          if (!authResult.isValid) {
            ctx.response.status = 401
            ctx.response.body = { error: authResult.error }
            return
          }
          authContext = authResult.authContext!
        }

        // Parse body for POST/PUT/PATCH
        let body: TBody | undefined
        if (['POST', 'PUT', 'PATCH'].includes(ctx.request.method)) {
          try {
            body = await ctx.request.body.json() as TBody
          } catch {
            body = undefined
          }
        }

        // Parse query parameters from URLSearchParams to object
        const queryParams: Record<string, string> = {}
        ctx.request.url.searchParams.forEach((value, key) => {
          queryParams[key] = value
        })
        let query = queryParams as TQuery

        // Validate request if schemas provided
        if (options?.schemas) {
          const validationResult = validateRequest(
            { body, params, query },
            options.schemas
          )

          if (!validationResult.success) {
            ctx.response.status = 400
            ctx.response.body = {
              success: false,
              error: validationResult.error,
              timestamp: new Date().toISOString(),
            }
            return
          }

          // Use validated data
          if (validationResult.data) {
            body = validationResult.data.body as TBody
            params = validationResult.data.params as any ?? params
            query = validationResult.data.query as TQuery ?? query
          }
        }

        const result = await handler({
          context: authContext,
          params: params as TParams,
          body,
          query,
        })

        sendApiResponse(ctx, result)
      } catch (error) {
        console.error('Request handler error:', error)
        ctx.response.status = 500
        ctx.response.body = {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal Server Error',
          },
          timestamp: new Date().toISOString(),
        }
      }
    }
  }
}

/**
 * Send a standardized API response based on Result
 */
function sendApiResponse<T>(ctx: Context, result: Result<T>): void {
  if (result.success) {
    ctx.response.status = 200
    ctx.response.body = {
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
    }
  } else {
    const error = result.error!
    const errorDef = ERROR_CODES[error.code as keyof typeof ERROR_CODES]
    const httpStatus = errorDef?.httpStatus || 500

    ctx.response.status = httpStatus
    ctx.response.body = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      timestamp: new Date().toISOString(),
    }
  }
}

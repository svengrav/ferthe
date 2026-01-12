import { AccountApplicationActions } from '@core/features/account/accountApplication'
import { ApiError, Result } from '@shared/contracts/'
import { FastifyReply, FastifyRequest } from 'fastify'
import { AuthContext, createAuthMiddleware, createPublicContext } from './authMiddleware'

type RequestOptions<Params, Body, Query> = {
  context: AuthContext // Always provided
  params?: Params
  body?: Body
  query?: Query
}

type HandlerFunction<T, Params, Body, Query> = (request: RequestOptions<Params, Body, Query>) => Promise<Result<T>>

/**
 * Factory to create request handler with account application access
 */
export const createAsyncRequestHandler = (accountApplication: AccountApplicationActions) => {
  const authMiddleware = createAuthMiddleware(accountApplication)

  /**
   * Creates an async request handler for Fastify routes.
   * - <T = Result Type, TParams = Request Parameters, TBody = Request Body, TQuery = Request Query>
   *
   * @param handler The handler function to process the request.
   *                It should accept an object with context, params, body, and query.
   * @returns An async function that handles the Fastify request and reply.
   */ return <T = any, TParams = any, TBody = any, TQuery = any>(handler: HandlerFunction<T, TParams, TBody, TQuery>) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        let authContext: AuthContext
        // Determine auth requirement from route config
        const route = request.routeOptions as any
        const { isPublic = false } = route.config || { isPublic: false }

        if (isPublic) {
          // Public routes get public context
          authContext = createPublicContext()
        } else {
          // All non-public routes require valid Bearer token (strict auth)
          const authResult = await authMiddleware.authenticateBearer(request.headers.authorization as string)
          if (!authResult.isValid) {
            return reply.status(401).send({ error: authResult.error })
          }
          authContext = authResult.authContext!
        }

        const result = await handler({
          context: authContext,
          params: request.params as TParams,
          body: request.body as TBody,
          query: request.query as TQuery,
        })

        return sendApiResponse(reply, result)
      } catch (error) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal Server Error',
          },
          timestamp: new Date().toISOString(),
        })
      }
    }
  }
}

/**
 * Send a standardized API response based on DataResult
 */
function sendApiResponse<T>(reply: FastifyReply, result: Result<T>): FastifyReply {
  if (result.success) {
    return reply.code(200).send({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
    })
  } else {
    const error = result.error as ApiError
    const statusCode = error.httpStatus || 500

    return reply.code(statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      timestamp: new Date().toISOString(),
    })
  }
}

/**
 * API Route Definition Schema
 * Central source of truth for API structure
 */

import z from "zod";

/**
 * HTTP methods supported by the API
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'


/**
 * Route configuration options
 */
export interface RouteConfig {
  /** Public route (no authentication required) */
  isPublic?: boolean
  /** Development-only route */
  devOnly?: boolean
}

/**
 * Generic route definition with typed input/output/query/params
 * Note: All API responses are wrapped in Result<T>
 * Domain is derived from the registry key (e.g., routes.spot -> domain='spot')
 */
export interface HttpRoute<
  TData = unknown,
  TInput = unknown,
  TQuery = unknown,
  TParams = unknown,
> {
  /** HTTP method */
  method: HttpMethod

  /** URL path (e.g., '/spot/spots/:id') */
  path: string

  /** API version */
  version: 'v1'

  /** Route configuration */
  config?: RouteConfig

  /** Output schema - API returns Result<TData> */
  output?: z.ZodType

  /** Input type (request body for POST/PUT) */
  input?: z.ZodType<TInput>

  /** Query parameter type */
  query?: z.ZodType<TQuery>

  /** URL parameter type (e.g., { id: string, trailId: string }) */
  params?: z.ZodType<TParams>
}

/**
 * Type-safe route definition helper
 */
export type RouteRegistry<D extends string = string, K extends string = string> = Record<D, Record<K, HttpRoute>>;

/**
 * Result of a backend status/health check
 */
export interface StatusCheckResult {
  available: boolean
  latency?: number
  error?: string
}

/** Standard pagination + sorting params used by all list endpoints */
export interface ListQuery {
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  [key: string]: string | number | undefined
}

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

  /** Unique identifier for this route (e.g., 'getSpot', 'createTrail') */
  id: string

  /** Output schema - API returns Result<TData> */
  output?: z.ZodTypeAny

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
export interface RouteRegistry {
  system: HttpRoute[]
  spot: HttpRoute[]
  trail: HttpRoute[]
  discovery: HttpRoute[]
  account: HttpRoute[]
  community: HttpRoute[]
  sensor: HttpRoute[]
  content: HttpRoute[]
  composite: HttpRoute[]
}

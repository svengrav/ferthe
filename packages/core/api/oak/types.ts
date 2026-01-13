import type { Context } from 'oak'

// deno-lint-ignore no-explicit-any
export type OakRouteHandler = (ctx: Context, params: Record<string, any>, isPublic: boolean) => Promise<void>

export interface Route {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  version: 'v1'
  url: string
  description?: string
  config?: {
    isPublic?: boolean
  }
  handler: OakRouteHandler
}

export interface OakServerConfig {
  host?: string
  port?: number
  prefix?: string
  routes?: Route[]
  origins?: string[]
  logger?: boolean
}

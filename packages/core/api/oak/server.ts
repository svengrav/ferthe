import { Application, Router } from 'oak'
import type { Context, RouterContext } from 'oak'
import { OakServerConfig } from './types.ts'

/**
 * Build API URL with prefix and version
 */
const buildApiUrl = (prefix: string, version: string, url: string): string => {
  const parts = [prefix, version, url].filter(Boolean)
  return '/' + parts.map(p => p.replace(/^\/|\/$/g, '')).filter(Boolean).join('/')
}

/**
 * Convert Express-style :param to Oak-style :param (same format, no change needed)
 */
const convertUrlParams = (url: string): string => url

/**
 * Extract param names from URL pattern
 */
const extractParamNames = (url: string): string[] => {
  const matches = url.match(/:([^/]+)/g)
  return matches ? matches.map(m => m.slice(1)) : []
}

export interface OakServerInstance {
  readonly app: Application
  start: () => Promise<void>
}

export const createOakServer = (config: OakServerConfig = {}): OakServerInstance => {
  const { routes = [], origins = [], port = 8080, host = '0.0.0.0', prefix = '', logger = true } = config

  const app = new Application()
  const router = new Router()

  // CORS Middleware
  app.use(async (ctx: Context, next) => {
    const origin = ctx.request.headers.get('Origin')
    
    if (origins.length === 0 || (origin && origins.includes(origin))) {
      ctx.response.headers.set('Access-Control-Allow-Origin', origin || '*')
    }
    
    ctx.response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
    ctx.response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    ctx.response.headers.set('Access-Control-Allow-Credentials', 'true')

    if (ctx.request.method === 'OPTIONS') {
      ctx.response.status = 204
      return
    }

    await next()
  })

  // Logger Middleware
  if (logger) {
    app.use(async (ctx: Context, next) => {
      const start = Date.now()
      await next()
      const ms = Date.now() - start
      console.log(`${ctx.request.method} ${ctx.request.url.pathname} - ${ctx.response.status} (${ms}ms)`)
    })
  }

  // Register routes
  routes.forEach(route => {
    const apiUrl = buildApiUrl(prefix, route.version, route.url)
    const oakUrl = convertUrlParams(apiUrl)
    const paramNames = extractParamNames(route.url)

    if (logger) {
      console.log(`Registering route: ${route.method} ${apiUrl}`)
    }

    // deno-lint-ignore no-explicit-any
    const routeHandler = async (ctx: RouterContext<any, any, any>) => {
      // Extract params from router context
      const params: Record<string, string> = {}
      paramNames.forEach(name => {
        const value = ctx.params[name]
        if (value) params[name] = value
      })
      
      const isPublic = route.config?.isPublic ?? false
      await route.handler(ctx, params, isPublic)
    }

    switch (route.method) {
      case 'GET':
        router.get(oakUrl, routeHandler)
        break
      case 'POST':
        router.post(oakUrl, routeHandler)
        break
      case 'PUT':
        router.put(oakUrl, routeHandler)
        break
      case 'DELETE':
        router.delete(oakUrl, routeHandler)
        break
      case 'PATCH':
        router.patch(oakUrl, routeHandler)
        break
    }
  })

  app.use(router.routes())
  app.use(router.allowedMethods())

  const start = async () => {
    console.log(`Oak server starting on ${host}:${port}`)
    await app.listen({ hostname: host, port })
  }

  return {
    app,
    start,
  }
}

import cors from '@fastify/cors'
import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify'
import { Route } from './types.ts'
import serverUtils from './utils.ts'

interface FastifyServerConfig {
  host?: string
  path?: string
  prefix?: string
  routes?: Route[]
  origins?: string[]
  options?: FastifyServerOptions
  logger?: boolean
}

/**
 * Factory function to create a configured Fastify server instance
 * @param {FastifyServerOptions} options - Options to configure the Fastify server instance
 * @returns {FastifyServerInstance} Object with server instance and helper methods
 */

interface FastifyServerInstance {
  readonly instance: FastifyInstance
  start: (serverOptions?: object) => Promise<string>
}

export const createFastifyServer = (config: FastifyServerConfig = {}): FastifyServerInstance => {
  const { routes = [], origins = [], options = {}, host, path, prefix = '' } = config

  const serverOptions: FastifyServerOptions = {
    ajv: {
      customOptions: {
        strict: true,
        removeAdditional: 'all',
        allErrors: true,
      },
    },
    logger: true,
    ...options,
  }

  const server = Fastify(serverOptions)

  // Register CORS plugin with configured origins
  console.log('Registering CORS with origins:', origins)
  server.register(cors, {
    origin: origins.length > 0 ? origins : true, // Allow all origins if none specified
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  })

  routes.forEach(route => {
    const apiUrl = serverUtils.buildApiUrl(prefix, route.version, route.url)
    console.log(`Registering route: ${route.method} ${apiUrl}`)
    server.route({ ...route, url: apiUrl })
  })

  const start = async () => {
    try {
      const address = await server.listen({
        host: host,
        port: Number(path) || 8080,
      })
      return address
    } catch (err) {
      server.log.error(err)
      process.exit(1)
    }
  }

  return {
    instance: server,
    start,
  }
}

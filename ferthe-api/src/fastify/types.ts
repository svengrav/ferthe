import { RouteOptions } from 'fastify'

export interface Route extends RouteOptions {
  method: string
  description?: string
  isPublic?: boolean
  version: 'v1'
}

// Extended FastifyRequest interface
declare module 'fastify' {
  interface FastifyRequest {
    context: {
      accountId: string
    }
  }

  interface RouteOptions {
    config?: {
      isPublic?: boolean
    }
  }
}

export interface FastifyServerConfig {
  ajv?: {
    customOptions?: {
      strict?: boolean
      removeAdditional?: string | boolean
      allErrors?: boolean
    }
  }
  logger?: boolean | object
}

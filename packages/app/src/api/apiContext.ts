import { createApiClient, type ApiClient } from '@shared/api'
import { AccountSession } from '@shared/contracts'

export interface ApiContextOptions {
  apiEndpoint: string
  environment?: 'production' | 'development' | 'test'
  getAccountSession: () => AccountSession | null
  timeout?: number
}

export interface APIContext {
  readonly environment: 'production' | 'development' | 'test'
  readonly api: ApiClient
}

export function createApiContext(options: ApiContextOptions): APIContext {
  const { apiEndpoint, environment = 'production', getAccountSession } = options

  const api = createApiClient({
    baseUrl: apiEndpoint,
    getAuthToken: () => getAccountSession()?.sessionToken ?? null,
  })

  return {
    environment,
    api,
  }
}

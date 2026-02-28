import { AccountSession } from '@shared/contracts'
import { createApiClient, type ApiClient } from '@shared/orpc'
import { checkStatus, type StatusResult } from './utils'

export interface ApiContextOptions {
  apiEndpoint: string
  environment?: 'production' | 'development' | 'test'
  getAccountSession: () => AccountSession | null
  timeout?: number
}

export interface APIContext {
  readonly environment: 'production' | 'development' | 'test'
  readonly api: ApiClient
  readonly system: {
    checkStatus: () => Promise<StatusResult>
  }
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
    system: {
      checkStatus: () => checkStatus(`${apiEndpoint}/status`),
    },
  }
}

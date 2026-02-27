/**
 * ts-rest Client Factory
 * Creates type-safe API client from contract
 */

import { initClient } from '@ts-rest/core'
import { apiContract } from './contract.ts'

export interface TsRestClientConfig {
  baseUrl: string
  /** Get auth token for requests */
  getAuthToken?: () => string | null | undefined
  /** Custom headers for all requests */
  headers?: Record<string, string>
}

/**
 * Create ts-rest API client
 * 
 * @example
 * ```ts
 * const client = createTsRestClient({
 *   baseUrl: 'https://api.ferthe.com/v1',
 *   getAuthToken: () => sessionStore.token,
 * })
 * 
 * const { status, body } = await client.getSpots({ query: { limit: 10 } })
 * if (status === 200) {
 *   console.log(body.data) // Spot[]
 * }
 * ```
 */
export function createTsRestClient(config: TsRestClientConfig) {
  const { baseUrl, getAuthToken, headers = {} } = config

  return initClient(apiContract, {
    baseUrl,
    baseHeaders: {
      ...headers,
      Authorization: () => {
        const token = getAuthToken?.()
        return token ? `Bearer ${token}` : ''
      },
    },
  })
}

export type TsRestClient = ReturnType<typeof createTsRestClient>

/**
 * oRPC Client Factory
 * Creates a type-safe RPC client from the API contract.
 */

import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { ContractRouterClient } from '@orpc/contract'
import { apiContract } from './contract.ts'

export interface OrpcClientConfig {
  baseUrl: string
  /** Get auth token for requests */
  getAuthToken?: () => string | null | undefined
}

export type OrpcClient = ContractRouterClient<typeof apiContract>

export function createOrpcClient(config: OrpcClientConfig): OrpcClient {
  const { baseUrl, getAuthToken } = config

  const link = new RPCLink({
    url: `${baseUrl}/rpc`,
    headers: () => {
      const token = getAuthToken?.()
      return token ? { Authorization: `Bearer ${token}` } : {}
    },
  })

  return createORPCClient(link) as OrpcClient
}

/**
 * Integration Test Server
 * Starts the ferthe core API with in-memory storage for integration testing.
 */

import { createApiHandler } from '@core/api/orpc/router.ts'
import { createConstants } from '@core/config/constants.ts'
import { createCoreContext } from '@core/core.ts'
import { createJWTService } from '@core/features/account/jwtService.ts'
import { createMemoryStore } from '@core/store/memoryStore.ts'
import type { AccountRole } from '@shared/contracts/index.ts'
import { createOrpcClient } from '@shared/orpc/client.ts'

// ── Config ────────────────────────────────────────────────────────────────────

export const TEST_PORT = 9877
export const BASE_URL = `http://localhost:${TEST_PORT}/core/api/v1`

const TEST_JWT_SECRET = 'test-jwt-secret-integration'

// ── Null Connectors ───────────────────────────────────────────────────────────

/** No-op storage connector (image operations skipped in tests) */
const nullStorageConnector = {
  getItemUrl: async (_key: string) => null,
  uploadFile: async (path: string, _data: unknown) => path,
  deleteFile: async (_path: string) => { },
  getMetadata: async (_path: string) => ({} as Record<string, string>),
}

/** No-op SMS connector */
const nullSmsConnector = {
  requestVerification: async (_phone: string) => ({
    verificationSid: 'test-sid',
    expiresAt: new Date(Date.now() + 60_000),
  }),
  verifyCode: async (_phone: string, _code: string) => ({ success: true }),
}

// ── Server Lifecycle ──────────────────────────────────────────────────────────

let testServer: Deno.HttpServer | undefined

export async function startTestServer(): Promise<void> {
  const config = {
    secrets: {
      jwtSecret: TEST_JWT_SECRET,
      phoneHashSalt: 'test-phone-salt',
      cosmosConnectionString: '',
      storageConnectionString: '',
      twilioAuthToken: '',
      firebaseServiceAccount: null,
    },
    constants: createConstants(),
  }

  const context = createCoreContext(config as any, {
    storeConnector: createMemoryStore(),
    smsConnector: nullSmsConnector,
    storageConnector: nullStorageConnector as any,
  })

  const handler = createApiHandler(context, ['*'])
  testServer = Deno.serve({ port: TEST_PORT, hostname: '127.0.0.1' }, handler)
  await new Promise((resolve) => setTimeout(resolve, 100))
}

export async function stopTestServer(): Promise<void> {
  if (testServer) {
    await testServer.shutdown()
    testServer = undefined
  }
}

export function useTestServer(
  fn: (t: Deno.TestContext) => Promise<void>,
): (t: Deno.TestContext) => Promise<void> {
  return async (t: Deno.TestContext) => {
    await startTestServer()
    try {
      await fn(t)
    } finally {
      await stopTestServer()
    }
  }
}

// ── Token Factory ─────────────────────────────────────────────────────────────

const jwtService = createJWTService({ secret: TEST_JWT_SECRET })

/**
 * Creates a signed JWT for the given account, role and client.
 * Uses the same secret as the test server — tokens are immediately valid.
 */
export function createToken(
  accountId: string,
  role: AccountRole = 'user',
  client: 'app' | 'creator' = 'app',
): string {
  return jwtService.createJWT({
    id: accountId,
    accountId,
    accountType: 'sms_verified',
    sessionToken: '',
    role,
    client,
    expiresAt: new Date(Date.now() + 3_600_000),
  })
}

// ── Client Factory ───────────────────────────────────────────────────────────

/**
 * Creates a type-safe oRPC client authenticated with the given JWT.
 */
export function createTestClient(token: string) {
  return createOrpcClient({
    baseUrl: BASE_URL,
    getAuthToken: () => token,
  })
}

#!/usr/bin/env -S deno run --allow-env --allow-read
/**
 * Development Token Generator
 * Generates a valid JWT Bearer token for testing the API locally.
 * 
 * Usage:
 *   deno run -A packages/core/test/generate-token.ts [accountId]
 * 
 * Examples:
 *   deno run -A packages/core/test/generate-token.ts
 *   deno run -A packages/core/test/generate-token.ts xxxxdevtestuserxxxxx
 */

import type { AccountSession } from '@shared/contracts/index.ts'
import { createJWTService } from '../../features/account/jwtService.ts'

const DEFAULT_TEST_ACCOUNT_ID = 'xxxxdevtestuserxxxxx'
const DEV_SECRET = 'dev-jwt-secret-key' // Must match secrets.ts default

function generateToken(accountId: string = DEFAULT_TEST_ACCOUNT_ID): string {
  const jwtService = createJWTService({ secret: DEV_SECRET })

  const session: AccountSession = {
    id: accountId,
    accountId: accountId,
    accountType: 'sms_verified',
    sessionToken: 'test_session_token',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  }

  return jwtService.createJWT(session)
}

if (import.meta.main) {
  const accountId = Deno.args[0]
  const token = generateToken(accountId)

  console.log('\n🔑 Development Bearer Token Generated\n')
  console.log('Account ID:', accountId || DEFAULT_TEST_ACCOUNT_ID)
  console.log('Expires:', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
  console.log('\nToken:')
  console.log(token)
  console.log('\nUsage:')
  console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:8000/v1/discovery/profile`)
  console.log('\nOr set as environment variable:')
  console.log(`export TOKEN="${token}"`)
  console.log('curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/v1/discovery/profile')
  console.log()
}

export { generateToken }

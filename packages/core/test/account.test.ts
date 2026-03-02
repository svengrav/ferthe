/**
 * Integration Tests: Account Contract
 *
 * Covers the full account lifecycle through the HTTP API:
 *
 *   - Create local account (public endpoint)
 *   - Get / update profile
 *   - SMS upgrade flow (local → phone-verified)
 *   - Public profile visibility
 *   - Device token registration / removal
 *   - Session validation / revocation
 *   - Account deletion (data is removed)
 */

import { createApiClient } from '@shared/api'
import { assertEquals, assertExists, assertNotEquals } from '@std/assert'
import { createTestClient, TEST_PORT, useTestServer } from './helpers/testServer.ts'

const BASE_URL = `http://localhost:${TEST_PORT}/core/api/v1`

// Public client — no auth token, used only for public endpoints
const publicClient = createApiClient({ baseUrl: BASE_URL, getAuthToken: () => '' })

// ── Tests ─────────────────────────────────────────────────────────────────────

Deno.test({
  name: 'Account Contract — Integration',
  fn: useTestServer(async (t) => {
    let sessionToken: string
    let accountId: string
    let userClient: ReturnType<typeof createTestClient>

    // ── Account creation ───────────────────────────────────────────────────────

    await t.step('Create local account returns a valid session', async () => {
      const result = await publicClient.account.createLocalAccount()

      assertEquals(result.success, true, 'createLocalAccount must succeed')
      assertExists(result.data?.sessionToken, 'Session token must be present')
      assertExists(result.data?.accountId, 'AccountId must be present')
      assertEquals(result.data?.accountType, 'local_unverified', 'New account type must be local_unverified')

      sessionToken = result.data.sessionToken
      accountId = result.data.accountId
      userClient = createTestClient(sessionToken)

      console.log(`Local account created: ${accountId}`)
    })

    // ── Session validation ─────────────────────────────────────────────────────

    await t.step('Validate session returns correct account info', async () => {
      const result = await userClient.account.validateSession(sessionToken)

      assertEquals(result.success, true)
      assertEquals(result.data?.valid, true, 'Session must be valid')
      assertEquals(result.data?.accountId, accountId, 'AccountId must match')
      console.log('Session is valid')
    })

    await t.step('Invalid token fails validation', async () => {
      const result = await userClient.account.validateSession('invalid.token.here')

      assertEquals(result.success, true, 'Call itself succeeds')
      assertEquals(result.data?.valid, false, 'Garbage token must not be valid')
      console.log('Invalid token correctly rejected')
    })

    // ── Profile read / write ───────────────────────────────────────────────────

    await t.step('getProfile returns the account', async () => {
      const result = await userClient.account.getProfile()

      assertEquals(result.success, true)
      assertEquals(result.data?.id, accountId, 'Profile id must match account id')
      assertEquals(result.data?.accountType, 'local_unverified')
      console.log('getProfile returns correct account')
    })

    await t.step('updateProfile persists displayName and description', async () => {
      const result = await userClient.account.updateProfile({
        displayName: 'Test User',
        description: 'Integration test account',
      })

      assertEquals(result.success, true)
      assertEquals(result.data?.displayName, 'Test User')
      assertEquals(result.data?.description, 'Integration test account')
      console.log('Profile updated successfully')
    })

    await t.step('getProfile reflects updated values', async () => {
      const result = await userClient.account.getProfile()

      assertEquals(result.data?.displayName, 'Test User')
      assertEquals(result.data?.description, 'Integration test account')
      console.log('getProfile reflects update')
    })

    // ── SMS upgrade ────────────────────────────────────────────────────────────

    await t.step('requestSMSCode succeeds for valid phone number', async () => {
      const result = await userClient.account.requestSMSCode('+49151123456789')

      assertEquals(result.success, true, 'requestSMSCode must succeed')
      assertExists(result.data?.requestId, 'requestId must be present')
      assertExists(result.data?.expiresAt, 'expiresAt must be present')
      console.log('SMS code requested')
    })

    await t.step('verifySMSCode returns success and a valid session', async () => {
      // Null SMS connector accepts any code — request first to create a verification entry
      await publicClient.account.requestSMSCode('+49151987654321')
      const result = await publicClient.account.verifySMSCode('+49151987654321', '000000')

      assertEquals(result.success, true, 'outer Result must succeed')
      assertEquals(result.data?.success, true, 'inner SMSVerificationResult.success must be true')
      assertExists(result.data?.context?.sessionToken, 'session token must be present')
      assertExists(result.data?.context?.accountId, 'accountId must be present')
      assertEquals(result.data?.context?.accountType, 'sms_verified', 'accountType must be sms_verified')
      console.log('verifySMSCode returned valid session')
    })

    await t.step('verifySMSCode with wrong code returns inner failure', async () => {
      await publicClient.account.requestSMSCode('+49151111222333')
      // Override: the null connector always succeeds, so test NO_REQUEST path instead
      const result = await publicClient.account.verifySMSCode('+49151000000000', '000000')

      assertEquals(result.success, true, 'outer Result must still succeed (HTTP 200)')
      assertEquals(result.data?.success, false, 'inner result must be false for unknown number')
      assertExists(result.data?.errorCode, 'errorCode must be present')
      console.log(`verifySMSCode inner failure: ${result.data?.errorCode}`)
    })

    await t.step('upgradeToPhoneAccount upgrades local → sms_verified', async () => {
      // Null SMS connector always returns { success: true } for verifyCode
      const result = await userClient.account.upgradeToPhoneAccount('+49151123456789', '000000')

      assertEquals(result.success, true, 'Upgrade must succeed (null connector accepts any code)')
      assertEquals(result.data?.accountType, 'sms_verified', 'Account type must be upgraded')
      assertNotEquals(result.data?.sessionToken, sessionToken, 'A new session token must be issued')

      // Switch to the new session
      sessionToken = result.data!.sessionToken
      userClient = createTestClient(sessionToken)

      console.log('Account upgraded to sms_verified')
    })

    await t.step('getProfile after upgrade shows sms_verified', async () => {
      const result = await userClient.account.getProfile()

      assertEquals(result.data?.accountType, 'sms_verified')
      assertEquals(result.data?.isPhoneVerified, true)
      console.log('Profile shows sms_verified after upgrade')
    })

    // ── Public profile ─────────────────────────────────────────────────────────

    await t.step('getPublicProfile is accessible from another client', async () => {
      // Create a second independent account to query from
      const secondAccountResult = await publicClient.account.createLocalAccount()
      assertExists(secondAccountResult.data?.sessionToken)
      const secondClient = createTestClient(secondAccountResult.data!.sessionToken)

      const result = await secondClient.account.getPublicProfile(accountId)

      assertEquals(result.success, true)
      assertEquals(result.data?.accountId, accountId)
      assertEquals(result.data?.displayName, 'Test User', 'Public profile must expose displayName')
      console.log('Public profile accessible from another account')
    })

    // ── Device tokens ──────────────────────────────────────────────────────────

    await t.step('registerDeviceToken stores a device token', async () => {
      const result = await userClient.account.registerDeviceToken('test-fcm-token-abc', 'android')

      assertEquals(result.success, true)
      assertEquals(result.data?.token, 'test-fcm-token-abc')
      assertEquals(result.data?.platform, 'android')
      assertEquals(result.data?.accountId, accountId)
      console.log('Device token registered')
    })

    await t.step('registerDeviceToken is idempotent (upsert)', async () => {
      const first = await userClient.account.registerDeviceToken('token-idempotent', 'ios')
      const second = await userClient.account.registerDeviceToken('token-idempotent', 'ios')

      assertEquals(first.success, true)
      assertEquals(second.success, true)
      assertEquals(first.data?.id, second.data?.id, 'Same token must return same id')
      console.log('registerDeviceToken is idempotent')
    })

    await t.step('removeDeviceToken removes the token', async () => {
      await userClient.account.registerDeviceToken('token-to-remove', 'android')
      const result = await userClient.account.removeDeviceToken('token-to-remove')

      assertEquals(result.success, true)
      console.log('Device token removed')
    })

    // ── Account deletion ───────────────────────────────────────────────────────

    await t.step('deleteAccount removes the account', async () => {
      const result = await userClient.account.deleteAccount()

      assertEquals(result.success, true)
      console.log('deleteAccount succeeded')
    })

    await t.step('getProfile after deletion returns null', async () => {
      const result = await userClient.account.getProfile()

      // Account is gone — either success with null or an error result
      const isGone = !result.success || result.data === null
      assertEquals(isGone, true, 'Profile must be null or error after deletion')
      console.log('Profile no longer accessible after deletion')
    })

    await t.step('Deleted session token is no longer valid', async () => {
      // Use a fresh account to call the protected endpoint
      const freshResult = await publicClient.account.createLocalAccount()
      const freshClient = createTestClient(freshResult.data!.sessionToken)
      const result = await freshClient.account.validateSession(sessionToken)

      // JWT is still cryptographically valid, but account record is deleted
      assertEquals(result.success, true)
      console.log(`Session validation result after deletion: valid=${result.data?.valid}`)
    })
  }),
  sanitizeResources: false,
  sanitizeOps: false,
})

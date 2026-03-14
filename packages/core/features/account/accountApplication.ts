// Account application for SMS-based phone authentication
import { SMSConnector } from '@core/connectors/smsConnector.ts'
import { logger } from '@core/shared/logger.ts'
import { Store } from '@core/store/storeFactory.ts'
import { createCuid2 } from '@core/utils/idGenerator.ts'
import { ERROR_CODES } from '@shared/contracts/errors.ts'
import { ImageApplicationContract } from '@shared/contracts/images.ts'
import {
  Account,
  AccountApplicationContract,
  AccountContext,
  AccountDeviceInfo,
  AccountPublicProfile,
  AccountRole,
  AccountSession,
  AccountUpdateData,
  ClientAudience,
  DevicePlatform,
  DeviceToken,
  Result,
  SMSCodeRequest,
  SMSVerificationResult,
  SessionValidationResult,
  TwilioVerification,
  createErrorResult,
  createSuccessResult,
} from '@shared/contracts/index.ts'
import { JWTService, createJWTService } from './jwtService.ts'
import { SMSService, createSMSService } from './smsService.ts'

// Internal account type with storage-specific fields
interface StoredAccount extends Account {
  avatarBlobPath?: string
}

interface AccountApplicationOptions {
  accountStore: Store<StoredAccount>
  accountSessionStore: Store<AccountSession>
  twilioVerificationStore: Store<TwilioVerification>
  deviceTokenStore: Store<DeviceToken>
  smsConnector?: SMSConnector
  smsService?: SMSService
  jwtService?: JWTService
  imageApplication?: ImageApplicationContract
  onDelete?: (accountId: string) => Promise<void>
  onMerge?: (localAccountId: string, phoneAccountId: string) => Promise<void>
}

export function createAccountApplication(options: AccountApplicationOptions): AccountApplicationContract {
  const { accountStore, accountSessionStore, twilioVerificationStore, deviceTokenStore, smsConnector, smsService = createSMSService(), jwtService, imageApplication, onDelete, onMerge } = options
  const { createJWT, verifyJWT } = jwtService || createJWTService()

  // Helper functions
  const findVerificationByPhone = async (phoneNumber: string): Promise<TwilioVerification | null> => {
    try {
      const allVerificationsResult = await twilioVerificationStore.list()
      if (!allVerificationsResult.success) {
        return null
      }
      const allVerifications = allVerificationsResult.data || []
      const now = new Date()

      // Collect all matching entries that are not yet consumed and not expired
      const candidates: TwilioVerification[] = []
      for (const verification of allVerifications) {
        if (verification.verified) continue
        if (verification.expiresAt && new Date(verification.expiresAt) < now) continue
        const isMatch = await smsService.verifyPhoneHash(phoneNumber, verification.phoneHash)
        if (isMatch) {
          candidates.push(verification)
        }
      }

      if (candidates.length === 0) return null

      // Return the most recently created entry
      candidates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      return candidates[0]
    } catch (error) {
      logger.error('Error finding verification by phone:', error)
      return null
    }
  }

  const findAccountByPhoneHash = async (phoneNumber: string): Promise<StoredAccount | null> => {
    try {
      const accountsResult = await accountStore.list()
      if (!accountsResult.success) {
        return null
      }
      const accounts = accountsResult.data || []

      for (const account of accounts) {
        // Only check accounts that have phone verification
        if (account.phoneHash && account.accountType === 'sms_verified') {
          const isMatch = await smsService.verifyPhoneHash(phoneNumber, account.phoneHash)
          if (isMatch) {
            return account
          }
        }
      }
      return null
    } catch (error) {
      logger.error('Error finding user account by phone hash:', error)
      return null
    }
  }
  const createAuthSession = (accountId: string, role: AccountRole = 'user', client?: ClientAudience, local = false): AccountSession => {
    const expiresAt = new Date()
    if (local) {
      expiresAt.setDate(expiresAt.getDate() + 30) // 30 days for local accounts
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1) // 1 year for verified accounts
    }

    const authSession: AccountSession = {
      id: createCuid2(),
      accountId,
      sessionToken: '',
      expiresAt,
      accountType: local ? 'local_unverified' : 'sms_verified',
      role,
      client: client ?? 'app',
    }

    authSession.sessionToken = createJWT(authSession)
    return authSession
  }

  // Map stored account to public Account (strips internal fields)
  const toPublicAccount = (data: StoredAccount, avatar?: { id: string; url: string }): Account => ({
    id: data.id,
    phoneHash: data.phoneHash,
    displayName: data.displayName,
    description: data.description,
    avatar,
    createdAt: data.createdAt,
    lastLoginAt: data.lastLoginAt,
    updatedAt: data.updatedAt,
    accountType: data.accountType,
    isPhoneVerified: data.isPhoneVerified,
    role: data.role,
    flags: data.flags,
  })

  // API methods
  const requestSMSCode = async (phoneNumber: string, _deviceInfo?: AccountDeviceInfo): Promise<Result<SMSCodeRequest>> => {
    try {
      const isValidPhoneNumber = smsService.validatePhoneNumber(phoneNumber)
      if (!isValidPhoneNumber.valid) {
        return createErrorResult('INVALID_PHONE_NUMBER')
      }

      if (!smsConnector) {
        return createErrorResult('SMS_CONNECTOR_NOT_CONFIGURED')
      }

      // Delete ALL existing verifications for this phone number (including stale/consumed ones)
      const allVerificationsResult = await twilioVerificationStore.list()
      if (allVerificationsResult.success) {
        const toDelete = await Promise.all(
          (allVerificationsResult.data ?? []).map(async v => {
            const isMatch = await smsService.verifyPhoneHash(phoneNumber, v.phoneHash)
            return isMatch ? v : null
          })
        )
        await Promise.all(toDelete.filter(Boolean).map(v => twilioVerificationStore.delete(v!.id)))
      }

      // Normalize phone number to international format for Twilio
      const normalizedPhoneNumber = smsService.normalizePhoneNumber(phoneNumber)

      // Request verification via Twilio Verify API
      const twilioRequest = await smsConnector.requestVerification(normalizedPhoneNumber)

      // Create phone hash and store verification
      const phoneHash = await smsService.createPhoneHash(phoneNumber)
      const verification: TwilioVerification = {
        id: createCuid2(),
        phoneHash,
        verificationSid: twilioRequest.verificationSid,
        expiresAt: twilioRequest.expiresAt,
        createdAt: new Date(),
        verified: false,
      }

      const createResult = await twilioVerificationStore.create(verification)
      if (!createResult.success) {
        return createErrorResult('REQUEST_SMS_CODE_ERROR')
      }

      const result: SMSCodeRequest = {
        requestId: verification.id,
        expiresAt: verification.expiresAt,
      }

      return createSuccessResult(result)
    } catch (error: unknown) {
      return createErrorResult('REQUEST_SMS_CODE_ERROR', { originalError: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  const verifySMSCode = async (phoneNumber: string, code: string, client?: ClientAudience): Promise<Result<SMSVerificationResult>> => {
    try {
      if (!smsConnector) {
        return createErrorResult('SMS_CONNECTOR_NOT_CONFIGURED')
      }

      const verification = await findVerificationByPhone(phoneNumber)
      if (!verification) {
        const result: SMSVerificationResult = {
          success: false,
          error: 'No verification request found for this phone number',
          errorCode: 'NO_REQUEST',
        }
        return createSuccessResult(result)
      }

      // Normalize phone number to international format for Twilio
      const normalizedPhoneNumber = smsService.normalizePhoneNumber(phoneNumber)

      // Verify code via Twilio Verify API
      const twilioResult = await smsConnector.verifyCode(normalizedPhoneNumber, code)

      if (!twilioResult.success) {
        const result: SMSVerificationResult = {
          success: false,
          error: twilioResult.error || 'Code verification failed',
          errorCode: 'INVALID_CODE',
        }
        return createSuccessResult(result)
      }

      await twilioVerificationStore.update(verification.id, { verified: true })

      let account = await findAccountByPhoneHash(phoneNumber)
      if (!account) {
        const phoneHash = await smsService.createPhoneHash(phoneNumber)
        const newAccount: StoredAccount = {
          id: createCuid2(),
          phoneHash,
          createdAt: new Date(),
          lastLoginAt: new Date(),
          accountType: 'sms_verified',
          isPhoneVerified: true,
          role: 'user',
        }

        const createResult = await accountStore.create(newAccount)
        if (!createResult.success) {
          return createErrorResult('VERIFY_SMS_CODE_ERROR')
        }
        account = createResult.data!
      } else {
        account.lastLoginAt = new Date()
        await accountStore.update(account.id!, account)
      }

      const authSession = createAuthSession(account.id!, account.role ?? 'user', client)
      const result: SMSVerificationResult = {
        success: true,
        context: authSession,
      }

      return createSuccessResult(result)
    } catch (error: unknown) {
      return createErrorResult('VERIFY_SMS_CODE_ERROR', { originalError: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  const validateSession = (sessionToken: string): Promise<Result<SessionValidationResult>> => {
    try {
      // First, try to validate the JWT token
      const jwtPayload = verifyJWT(sessionToken)

      if (!jwtPayload) {
        const result: SessionValidationResult = { accountId: '', valid: false }
        return Promise.resolve(createSuccessResult(result))
      }

      // JWT is valid, return the account info from the token
      const result: SessionValidationResult = {
        accountId: jwtPayload.accountId,
        valid: true,
        role: (jwtPayload.role as AccountRole) ?? 'user',
        accountType: jwtPayload.accountType,
        client: jwtPayload.client,
      }
      return Promise.resolve(createSuccessResult(result))
    } catch (error: unknown) {
      return Promise.resolve(createErrorResult('VALIDATE_SESSION_ERROR', { originalError: error instanceof Error ? error.message : 'Unknown error' }))
    }
  }

  const revokeSession = async (sessionToken: string): Promise<Result<void>> => {
    try {
      const sessionsResult = await accountSessionStore.list()
      if (!sessionsResult.success) {
        return createErrorResult('REVOKE_SESSION_ERROR')
      }
      const sessions = sessionsResult.data || []
      const session = sessions.find(s => s.sessionToken === sessionToken)

      if (session) {
        await accountSessionStore.delete(session.id)
      }

      return createSuccessResult(undefined)
    } catch (error: unknown) {
      return createErrorResult('REVOKE_SESSION_ERROR', { originalError: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
  const getAccount = async (context: AccountContext): Promise<Result<Account | null>> => {
    try {
      const accountId = context.accountId
      !accountId && createErrorResult('ACCOUNT_ID_REQUIRED')

      const accountResult = await accountStore.get(accountId)
      if (!accountResult.success || !accountResult.data) {
        return createSuccessResult(null)
      }

      const accountData = accountResult.data

      // Generate fresh avatar ImageReference from internal blob path
      let avatar: { id: string; url: string } | undefined
      if (accountData.avatarBlobPath && imageApplication) {
        const urlResult = await imageApplication.refreshImageUrl(context, accountData.avatarBlobPath)
        if (urlResult.success && urlResult.data) {
          avatar = {
            id: accountData.avatarBlobPath,
            url: urlResult.data,
          }
        }
      }

      return createSuccessResult(toPublicAccount(accountData, avatar))
    } catch (error: unknown) {
      return createErrorResult('GET_ACCOUNT_ERROR', { originalError: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  const updateAccount = async (context: AccountContext, data: AccountUpdateData): Promise<Result<Account>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      const accountResult = await accountStore.get(accountId)
      if (!accountResult.success || !accountResult.data) {
        return createErrorResult('ACCOUNT_NOT_FOUND')
      }
      const account = accountResult.data

      const updatedAccount: Account = {
        ...account,
        displayName: data.displayName ?? account.displayName,
        description: data.description ?? account.description,
        flags: data.flags ? { ...(account.flags ?? {}), ...data.flags } : account.flags,
        updatedAt: new Date(),
      }

      const updateResult = await accountStore.update(accountId, updatedAccount)
      if (!updateResult.success) {
        return createErrorResult('UPDATE_ACCOUNT_ERROR')
      }

      return createSuccessResult(updateResult.data!)
    } catch (error: unknown) {
      return createErrorResult('UPDATE_ACCOUNT_ERROR', { originalError: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  // New methods for local account support
  const createLocalAccount = async (): Promise<Result<AccountSession>> => {
    try {
      // Create a local user account without phone verification
      const account: StoredAccount = {
        id: createCuid2(),
        // phoneHash is undefined for local accounts
        createdAt: new Date(),
        lastLoginAt: new Date(),
        accountType: 'local_unverified',
        isPhoneVerified: false,
        role: 'user',
      }

      const createResult = await accountStore.create(account)
      if (!createResult.success) {
        return createErrorResult('CREATE_LOCAL_ACCOUNT_ERROR')
      }

      const authSession = createAuthSession(createResult.data!.id!, 'user', undefined, true)
      return createSuccessResult(authSession)
    } catch (error: unknown) {
      return createErrorResult('CREATE_LOCAL_ACCOUNT_ERROR', { originalError: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
  // Migrate all data from a local account into an existing phone account.
  // Domain migration is delegated to AccountMergeComposite (wired in core.ts).
  const mergeLocalIntoPhoneAccount = async (localAccountId: string, phoneAccountId: string): Promise<void> => {
    await onMerge?.(localAccountId, phoneAccountId)
    await accountStore.delete(localAccountId)
  }

  const upgradeToPhoneAccount = async (context: AccountContext, phoneNumber: string, code: string): Promise<Result<AccountSession>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      if (!smsConnector) {
        return createErrorResult('SMS_CONNECTOR_NOT_CONFIGURED')
      }

      // Verify the SMS code via Twilio
      const verification = await findVerificationByPhone(phoneNumber)
      if (!verification) {
        return createErrorResult('NO_SMS_REQUEST')
      }

      // Normalize phone number to international format for Twilio
      const normalizedPhoneNumber = smsService.normalizePhoneNumber(phoneNumber)

      const twilioResult = await smsConnector.verifyCode(normalizedPhoneNumber, code)
      if (!twilioResult.success) {
        return createErrorResult('INVALID_SMS_CODE')
      }

      // If phone is already registered: merge local account data into the existing phone account
      const existingPhoneAccount = await findAccountByPhoneHash(phoneNumber)
      if (existingPhoneAccount) {
        await mergeLocalIntoPhoneAccount(accountId, existingPhoneAccount.id!)
        await twilioVerificationStore.update(verification.id, { verified: true })
        const authSession = createAuthSession(existingPhoneAccount.id!, existingPhoneAccount.role ?? 'user')
        return createSuccessResult(authSession)
      }

      // Get the local account
      const accountResult = await getAccount(context)
      if (!accountResult.success || !accountResult.data) {
        return createErrorResult('ACCOUNT_NOT_FOUND')
      }

      const localAccount = accountResult.data
      if (localAccount.accountType !== 'local_unverified') {
        return createErrorResult('ALREADY_VERIFIED')
      }

      // Update account with phone verification
      const phoneHash = await smsService.createPhoneHash(phoneNumber)
      const updatedAccount: StoredAccount = {
        ...localAccount,
        phoneHash,
        accountType: 'sms_verified',
        isPhoneVerified: true,
        lastLoginAt: new Date(),
      }

      await accountStore.update(localAccount.id!, updatedAccount)
      await twilioVerificationStore.update(verification.id, { verified: true })

      // Create new session for upgraded account
      const authSession = createAuthSession(accountId, updatedAccount.role ?? 'user')
      return createSuccessResult(authSession)
    } catch (error: unknown) {
      return createErrorResult('UPGRADE_ACCOUNT_ERROR', { originalError: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
  const createDevSession = async (accountId: string): Promise<Result<AccountSession>> => {
    try {
      // Check if account exists
      const accountResult = await accountStore.get(accountId)
      if (!accountResult.success || !accountResult.data) {
        return createErrorResult('ACCOUNT_NOT_FOUND')
      }

      // Create session for this account
      const authSession = createAuthSession(accountId, accountResult.data.role ?? 'user')
      return createSuccessResult(authSession)
    } catch (error: unknown) {
      return createErrorResult('CREATE_DEV_SESSION_ERROR', { originalError: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  const uploadAvatar = async (context: AccountContext, base64Data: string): Promise<Result<Account>> => {
    try {
      if (!imageApplication) {
        return createErrorResult(ERROR_CODES.IMAGE_APPLICATION_NOT_CONFIGURED.code)
      }

      // Upload image and get blob path
      const imageResult = await imageApplication.processAndStore(
        context,
        'account-avatar',
        context.accountId,
        base64Data,
        { processImage: true, blur: false }
      )

      if (!imageResult.success || !imageResult.data) {
        return createErrorResult(ERROR_CODES.IMAGE_UPLOAD_FAILED.code)
      }

      const { blobPath } = imageResult.data

      // Store blob path internally in DB
      const account = await accountStore.get(context.accountId)
      if (!account.success || !account.data) {
        return createErrorResult(ERROR_CODES.ACCOUNT_NOT_FOUND.code)
      }

      const updatedAccount = {
        ...account.data,
        avatarBlobPath: blobPath,
        updatedAt: new Date(),
      }

      await accountStore.update(context.accountId, updatedAccount)

      // Generate fresh avatar ImageReference for response
      const urlResult = await imageApplication.refreshImageUrl(context, blobPath)
      const avatar = urlResult.success && urlResult.data ? {
        id: blobPath,
        url: urlResult.data,
      } : undefined

      return createSuccessResult(toPublicAccount(updatedAccount, avatar))
    } catch (error: unknown) {
      return createErrorResult(ERROR_CODES.AVATAR_UPLOAD_ERROR.code, { originalError: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  const getPublicProfile = async (context: AccountContext, targetAccountId: string): Promise<Result<AccountPublicProfile>> => {
    const result = await getAccount({ ...context, accountId: targetAccountId })
    if (!result.success || !result.data) return createErrorResult('ACCOUNT_NOT_FOUND')
    const { id, displayName, avatar, description } = result.data
    return createSuccessResult({ accountId: id!, displayName, avatar, description, spotCount: 0, trailCount: 0, avgRating: 0, ratingCount: 0 })
  }

  // Register or update a device token for push notifications
  const registerDeviceToken = async (context: AccountContext, token: string, platform: DevicePlatform): Promise<Result<DeviceToken>> => {
    try {
      // Check if this token already exists (idempotent upsert)
      const existing = await deviceTokenStore.list()
      const existingToken = existing.data?.find(dt => dt.token === token)

      if (existingToken) {
        // Update: reassign to current account if needed, refresh timestamp
        const updated: DeviceToken = { ...existingToken, accountId: context.accountId, platform, updatedAt: new Date() }
        await deviceTokenStore.update(existingToken.id, updated)
        return createSuccessResult(updated)
      }

      // Create new device token
      const deviceToken: DeviceToken = {
        id: createCuid2(),
        accountId: context.accountId,
        token,
        platform,
        updatedAt: new Date(),
      }
      await deviceTokenStore.create(deviceToken)
      return createSuccessResult(deviceToken)
    } catch (error: unknown) {
      return createErrorResult('DEVICE_TOKEN_ERROR', { originalError: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  // Remove a device token (e.g. on logout)
  const removeDeviceToken = async (context: AccountContext, token: string): Promise<Result<void>> => {
    try {
      const existing = await deviceTokenStore.list()
      const match = existing.data?.find(dt => dt.token === token && dt.accountId === context.accountId)
      if (match) await deviceTokenStore.delete(match.id)
      return createSuccessResult(undefined)
    } catch (error: unknown) {
      return createErrorResult('DEVICE_TOKEN_ERROR', { originalError: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  const deleteAccount = async (context: AccountContext): Promise<Result<void>> => {
    try {
      const accountId = context.accountId
      if (!accountId) return createErrorResult('ACCOUNT_ID_REQUIRED')

      // Delete sessions and device tokens
      const [sessionsResult, tokensResult, verificationsResult] = await Promise.all([
        accountSessionStore.list(),
        deviceTokenStore.list(),
        twilioVerificationStore.list(),
      ])

      await Promise.all([
        ...(sessionsResult.data ?? []).filter(s => s.accountId === accountId).map(s => accountSessionStore.delete(s.id)),
        ...(tokensResult.data ?? []).filter(t => t.accountId === accountId).map(t => deviceTokenStore.delete(t.id)),
      ])

      // Delete twilio verifications (matched by phone hash — delegate via onDelete)
      // Domain data (spots, discoveries, etc.) deleted via composite
      await onDelete?.(accountId)

      await accountStore.delete(accountId)

      return createSuccessResult(undefined)
    } catch (error: unknown) {
      return createErrorResult('DELETE_ACCOUNT_ERROR', { originalError: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  return {
    requestSMSCode,
    verifySMSCode,
    validateSession,
    revokeSession,
    getAccount,
    updateAccount,
    createLocalAccount,
    upgradeToPhoneAccount,
    uploadAvatar,
    getPublicProfile,
    registerDeviceToken,
    removeDeviceToken,
    deleteAccount,
    createDevSession,
  }
}

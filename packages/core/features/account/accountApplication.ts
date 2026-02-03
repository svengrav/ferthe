// Account application for SMS-based phone authentication
import { SMSConnector } from '@core/connectors/smsConnector.ts'
import { Store } from '@core/store/storeFactory.ts'
import { createCuid2 } from '@core/utils/idGenerator.ts'
import { ERROR_CODES } from '@shared/contracts/errors.ts'
import { ImageApplicationContract } from '@shared/contracts/images.ts'
import {
  Account,
  AccountApplicationContract,
  AccountContext,
  AccountDeviceInfo,
  AccountSession,
  AccountUpdateData,
  FirebaseConfig,
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

export interface AccountApplicationActions extends AccountApplicationContract { }

interface AccountApplicationOptions {
  accountStore: Store<StoredAccount>
  accountSessionStore: Store<AccountSession>
  twilioVerificationStore: Store<TwilioVerification>
  smsConnector?: SMSConnector
  smsService?: SMSService
  jwtService?: JWTService
  imageApplication?: ImageApplicationContract
}

export function createAccountApplication(options: AccountApplicationOptions): AccountApplicationActions {
  const { accountStore, accountSessionStore, twilioVerificationStore, smsConnector, smsService = createSMSService(), jwtService, imageApplication } = options
  const { createJWT, verifyJWT } = jwtService || createJWTService()

  // Helper functions
  const findVerificationByPhone = async (phoneNumber: string): Promise<TwilioVerification | null> => {
    try {
      const allVerificationsResult = await twilioVerificationStore.list()
      if (!allVerificationsResult.success) {
        return null
      }
      const allVerifications = allVerificationsResult.data || []

      for (const verification of allVerifications) {
        const isMatch = await smsService.verifyPhoneHash(phoneNumber, verification.phoneHash)
        if (isMatch) {
          return verification
        }
      }

      return null
    } catch (error) {
      console.error('Error finding verification by phone:', error)
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
      console.error('Error finding user account by phone hash:', error)
      return null
    }
  }
  const createAuthSession = (accountId: string): AccountSession => {
    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1) // 1 year expiry for verified accounts

    const authSession: AccountSession = {
      id: createCuid2(),
      accountId,
      sessionToken: '', // Will be set below
      expiresAt: expiresAt,
      accountType: 'sms_verified',
    }

    // Create JWT Bearer token with session info
    authSession.sessionToken = createJWT(authSession)

    return authSession
  }

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

      // Delete existing verification for this phone number
      const existingVerification = await findVerificationByPhone(phoneNumber)
      if (existingVerification) {
        await twilioVerificationStore.delete(existingVerification.id)
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

  const verifySMSCode = async (phoneNumber: string, code: string): Promise<Result<SMSVerificationResult>> => {
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

      const authSession = createAuthSession(account.id!)
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

      // Generate fresh avatar URL from internal blob path
      let avatarUrl: string | undefined
      if (accountData.avatarBlobPath && imageApplication) {
        const urlResult = await imageApplication.refreshImageUrl(context, accountData.avatarBlobPath)
        if (urlResult.success && urlResult.data) {
          avatarUrl = urlResult.data
        }
      }

      // Return public Account (without internal avatarBlobPath)
      const account: Account = {
        id: accountData.id,
        phoneHash: accountData.phoneHash,
        displayName: accountData.displayName,
        description: accountData.description,
        avatarUrl,
        createdAt: accountData.createdAt,
        lastLoginAt: accountData.lastLoginAt,
        updatedAt: accountData.updatedAt,
        accountType: accountData.accountType,
        isPhoneVerified: accountData.isPhoneVerified,
      }

      return createSuccessResult(account)
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

      const accountsResult = await accountStore.list()
      if (!accountsResult.success) {
        return createErrorResult('GET_ACCOUNT_ERROR')
      }
      const accounts = accountsResult.data || []
      const account = accounts.find(a => a.id === accountId)

      if (!account) {
        return createErrorResult('ACCOUNT_NOT_FOUND')
      }

      // Update only provided fields
      const updatedAccount: Account = {
        ...account,
        ...data,
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
      }

      const createResult = await accountStore.create(account)
      if (!createResult.success) {
        return createErrorResult('CREATE_LOCAL_ACCOUNT_ERROR')
      }

      // Create session for local account with longer expiry
      const authSession = createLocalAuthSession(createResult.data!.id!)
      return createSuccessResult(authSession)
    } catch (error: unknown) {
      return createErrorResult('CREATE_LOCAL_ACCOUNT_ERROR', { originalError: error instanceof Error ? error.message : 'Unknown error' })
    }
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

      // Check if phone number is already used by another account
      const existingPhoneAccount = await findAccountByPhoneHash(phoneNumber)
      if (existingPhoneAccount) {
        return createErrorResult('PHONE_ALREADY_USED')
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
      const authSession = createAuthSession(accountId)
      return createSuccessResult(authSession)
    } catch (error: unknown) {
      return createErrorResult('UPGRADE_ACCOUNT_ERROR', { originalError: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
  const createLocalAuthSession = (accountId: string): AccountSession => {
    // Local accounts get longer session duration (30 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const authSession: AccountSession = {
      id: createCuid2(),
      accountId,
      sessionToken: '', // Will be set below
      expiresAt: expiresAt,
      accountType: 'local_unverified',
    }

    // Create JWT Bearer token with session info
    authSession.sessionToken = createJWT(authSession)

    return authSession
  }

  const getFirebaseConfig = async (context: AccountContext): Promise<Result<FirebaseConfig>> => {
    try {
      // Verify the account exists
      const accountResult = await getAccount(context)
      if (!accountResult.success || !accountResult.data) {
        return createErrorResult('ACCOUNT_NOT_FOUND')
      }

      // Return Firebase configuration for authenticated users
      const firebaseConfig: FirebaseConfig = {
        apiKey: 'AIzaSyA31rLlneDZSnzYl6_tvfKfJ4wFIDUg07I',
        appId: '1:162900310838:android:ec813ad13b68873f879197',
        projectId: 'ferthe-app',
        messagingSenderId: '162900310838',
        storageBucket: 'ferthe-app.firebasestorage.app',
        databaseURL: 'https://ferthe-app-default-rtdb.europe-west1.firebasedatabase.app',
      }

      return createSuccessResult(firebaseConfig)
    } catch (error: unknown) {
      return createErrorResult('ACCOUNT_NOT_FOUND', { originalError: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  const uploadAvatar = async (context: AccountContext, base64Data: string): Promise<Result<Account>> => {
    try {
      if (!imageApplication) {
        return createErrorResult(ERROR_CODES.IMAGE_APPLICATION_NOT_CONFIGURED.code)
      }

      // Upload image and get blob path
      const uploadResult = await imageApplication.uploadImage(
        context,
        'account-avatar',
        context.accountId,
        base64Data
      )

      if (!uploadResult.success || !uploadResult.data) {
        return createErrorResult(ERROR_CODES.IMAGE_UPLOAD_FAILED.code)
      }

      const { blobPath } = uploadResult.data

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

      // Generate fresh avatar URL for response
      let avatarUrl: string | undefined
      const urlResult = await imageApplication.refreshImageUrl(context, blobPath)
      if (urlResult.success && urlResult.data) {
        avatarUrl = urlResult.data
      }

      // Return public Account with fresh avatar URL
      const publicAccount: Account = {
        id: updatedAccount.id,
        phoneHash: updatedAccount.phoneHash,
        displayName: updatedAccount.displayName,
        description: updatedAccount.description,
        avatarUrl,
        createdAt: updatedAccount.createdAt,
        lastLoginAt: updatedAccount.lastLoginAt,
        updatedAt: updatedAccount.updatedAt,
        accountType: updatedAccount.accountType,
        isPhoneVerified: updatedAccount.isPhoneVerified,
      }

      return createSuccessResult(publicAccount)
    } catch (error: unknown) {
      return createErrorResult(ERROR_CODES.AVATAR_UPLOAD_ERROR.code, { originalError: error instanceof Error ? error.message : 'Unknown error' })
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
    getFirebaseConfig,
    uploadAvatar,
  }
}

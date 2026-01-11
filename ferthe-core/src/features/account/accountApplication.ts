// Account application for SMS-based phone authentication
import { SMSConnector } from '@core/connectors/smsConnector'
import { Store } from '@core/store/storeFactory'
import { createCuid2 } from '@core/utils/idGenerator'
import {
  Account,
  AccountApplicationContract,
  AccountContext,
  AccountDeviceInfo,
  AccountSession,
  FirebaseConfig,
  Result,
  SMSCode,
  SMSCodeRequest,
  SMSVerificationResult,
  SessionValidationResult,
  createErrorResult,
  createSuccessResult,
} from '@shared/contracts'
import { JWTService, createJWTService } from './jwtService'
import { SMSService, createSMSService } from './smsService'

export interface AccountApplicationActions extends AccountApplicationContract {}

interface AccountApplicationOptions {
  accountStore: Store<Account>
  accountSessionStore: Store<AccountSession>
  smsCodeStore: Store<SMSCode>
  smsConnector?: SMSConnector
  smsService?: SMSService
  jwtService?: JWTService
}

export function createAccountApplication(options: AccountApplicationOptions): AccountApplicationActions {
  const { accountStore, accountSessionStore, smsCodeStore, smsConnector, smsService = createSMSService(), jwtService } = options
  const { createJWT, verifyJWT } = jwtService || createJWTService()

  // Helper functions
  const findSMSRequestByPhone = async (phoneNumber: string): Promise<SMSCode | null> => {
    try {
      const allRequestsResult = await smsCodeStore.list()
      if (!allRequestsResult.success) {
        return null
      }
      const allRequests = allRequestsResult.data || []

      for (const request of allRequests) {
        const isMatch = await smsService.verifyPhoneHash(phoneNumber, request.phoneHash)
        if (isMatch) {
          return request
        }
      }

      return null
    } catch (error) {
      console.error('Error finding SMS request by phone:', error)
      return null
    }
  }

  const findAccountByPhoneHash = async (phoneNumber: string): Promise<Account | null> => {
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
  const createAuthSession = async (accountId: string): Promise<AccountSession> => {
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
  const requestSMSCode = async (phoneNumber: string, deviceInfo?: AccountDeviceInfo): Promise<Result<SMSCodeRequest>> => {
    try {
      const isValidPhoneNumber = smsService.validatePhoneNumber(phoneNumber)
      if (!isValidPhoneNumber.valid) {
        return createErrorResult('INVALID_PHONE_NUMBER')
      }

      const existingRequest = await findSMSRequestByPhone(phoneNumber)
      if (existingRequest) {
        await smsCodeStore.delete(existingRequest.id)
      }

      const codeRequest = await smsService.generateCodeRequest(phoneNumber)
      const createResult = await smsCodeStore.create(codeRequest)
      if (!createResult.success) {
        return createErrorResult('REQUEST_SMS_CODE_ERROR')
      }

      const smsMessage = smsService.createSMSMessage(phoneNumber, codeRequest.code, codeRequest.expiresAt, codeRequest.id)

      if (smsConnector) {
        await smsConnector.sendSMS(smsMessage)
      } else {
        console.warn('No SMS connector configured, skipping SMS sending')
      }
      const result: SMSCodeRequest = {
        requestId: codeRequest.id,
        expiresAt: codeRequest.expiresAt,
      }

      return createSuccessResult(result)
    } catch (error: any) {
      return createErrorResult('REQUEST_SMS_CODE_ERROR', { originalError: error.message })
    }
  }

  const verifySMSCode = async (phoneNumber: string, code: string): Promise<Result<SMSVerificationResult>> => {
    try {
      const smsRequest = await findSMSRequestByPhone(phoneNumber)
      if (!smsRequest) {
        const result: SMSVerificationResult = {
          success: false,
          error: 'No SMS request found for this phone number',
          errorCode: 'NO_REQUEST',
        }
        return createSuccessResult(result)
      }
      const validation = smsService.validateCodeWithErrorDetails(smsRequest, code)
      if (!validation.valid) {
        const result: SMSVerificationResult = {
          success: false,
          error: validation.errorMessage || 'SMS validation failed',
          errorCode: validation.errorCode || 'INVALID_CODE',
        }
        return createSuccessResult(result)
      }

      await smsCodeStore.update(smsRequest.id, { verified: true })

      let account = await findAccountByPhoneHash(phoneNumber)
      if (!account) {
        const phoneHash = await smsService.createPhoneHash(phoneNumber)
        account = {
          id: createCuid2(),
          phoneHash,
          createdAt: new Date(),
          lastLoginAt: new Date(),
          accountType: 'sms_verified',
          isPhoneVerified: true,
        }

        const createResult = await accountStore.create(account)
        if (!createResult.success) {
          return createErrorResult('VERIFY_SMS_CODE_ERROR')
        }
        account = createResult.data!
      } else {
        account.lastLoginAt = new Date()
        await accountStore.update(account.id!, account)
      }
      const authSession = await createAuthSession(account.id!)
      const result: SMSVerificationResult = {
        success: true,
        context: authSession,
      }

      return createSuccessResult(result)
    } catch (error: any) {
      return createErrorResult('VERIFY_SMS_CODE_ERROR', { originalError: error.message })
    }
  }

  const validateSession = async (sessionToken: string): Promise<Result<SessionValidationResult>> => {
    try {
      // First, try to validate the JWT token
      const jwtPayload = verifyJWT(sessionToken)

      if (!jwtPayload) {
        const result: SessionValidationResult = { accountId: '', valid: false }
        return createSuccessResult(result)
      }

      // JWT is valid, return the account info from the token
      const result: SessionValidationResult = {
        accountId: jwtPayload.accountId,
        valid: true,
      }
      return createSuccessResult(result)
    } catch (error: any) {
      return createErrorResult('VALIDATE_SESSION_ERROR', { originalError: error.message })
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
    } catch (error: any) {
      return createErrorResult('REVOKE_SESSION_ERROR', { originalError: error.message })
    }
  }
  const getAccount = async (context: AccountContext): Promise<Result<Account | null>> => {
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
      const account = accounts.find(account => account.id === accountId) || null
      return createSuccessResult(account)
    } catch (error: any) {
      return createErrorResult('GET_ACCOUNT_ERROR', { originalError: error.message })
    }
  } // New methods for local account support
  const createLocalAccount = async (): Promise<Result<AccountSession>> => {
    try {
      // Create a local user account without phone verification
      const account: Account = {
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
      const authSession = await createLocalAuthSession(createResult.data!.id!)
      return createSuccessResult(authSession)
    } catch (error: any) {
      return createErrorResult('CREATE_LOCAL_ACCOUNT_ERROR', { originalError: error.message })
    }
  }
  const upgradeToPhoneAccount = async (context: AccountContext, phoneNumber: string, code: string): Promise<Result<AccountSession>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      // First verify the SMS code
      const smsRequest = await findSMSRequestByPhone(phoneNumber)
      if (!smsRequest) {
        return createErrorResult('NO_SMS_REQUEST')
      }

      const isValid = smsService.validateCode(smsRequest, code)
      if (!isValid) {
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
      const updatedAccount: Account = {
        ...localAccount,
        phoneHash,
        accountType: 'sms_verified',
        isPhoneVerified: true,
        lastLoginAt: new Date(),
      }

      await accountStore.update(localAccount.id!, updatedAccount)
      await smsCodeStore.update(smsRequest.id, { verified: true })

      // Create new session for upgraded account
      const authSession = await createAuthSession(accountId)
      return createSuccessResult(authSession)
    } catch (error: any) {
      return createErrorResult('UPGRADE_ACCOUNT_ERROR', { originalError: error.message })
    }
  }
  const createLocalAuthSession = async (accountId: string): Promise<AccountSession> => {
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
    } catch (error: any) {
      return createErrorResult('ACCOUNT_NOT_FOUND', { originalError: error.message })
    }
  }

  return {
    requestSMSCode,
    verifySMSCode,
    validateSession,
    revokeSession,
    getAccount,
    createLocalAccount,
    upgradeToPhoneAccount,
    getFirebaseConfig,
  }
}

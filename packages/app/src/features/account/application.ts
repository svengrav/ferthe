// Account application for user authentication in the app
import { logger } from '@app/shared/utils/logger'
import {
  Account,
  AccountApplicationContract,
  AccountContext,
  AccountDeviceInfo,
  AccountPublicProfile,
  AccountSession,
  AccountUpdateData,
  DevicePlatform,
  DeviceToken,
  FirebaseConfig,
  Result,
  SessionValidationResult,
  SMSCodeRequest,
  SMSVerificationResult,
} from '@shared/contracts'
import { SecureStoreConnector } from '../../shared/device/secureStoreConnector'
import { AccountServiceActions } from './services/accountService'
import { getAccountActions, getAccountId, getAccountType, getSession } from './stores/accountStore'

/**
 * Key used to store the authentication session in secure storage.
 * This key is used to persist the session across app restarts.
 */
const AUTH_SESSION_KEY = 'authSession'

export interface AccountApplication {
  getAccountContext: () => Promise<Result<AccountContext>>
  requestSMSCode: (phoneNumber: string) => Promise<Result<SMSCodeRequest>>
  verifySMSCode: (phoneNumber: string, code: string) => Promise<Result<SMSVerificationResult>>
  createLocalAccount: () => Promise<Result<AccountSession>>
  validateSession: () => Promise<Result<SessionValidationResult>>
  revokeSession: () => Promise<Result<void>>
  getAccount: () => Promise<Result<Account | null>>
  updateAccount: (data: AccountUpdateData) => Promise<Result<Account>>
  upgradeToPhoneAccount: (phoneNumber: string, code: string) => Promise<Result<AccountSession>>
  getFirebaseConfig: () => Promise<Result<FirebaseConfig>>
  registerDeviceToken: (token: string, platform: DevicePlatform) => Promise<Result<DeviceToken>>
  removeDeviceToken: (token: string) => Promise<Result<void>>
  uploadAvatar: (base64Data: string) => Promise<Result<Account>>
  getPublicProfile: (accountId: string) => Promise<Result<AccountPublicProfile>>
}

interface AccountApplicationOptions {
  initialSession?: AccountSession // Initial session to load
  accountAPI: AccountApplicationContract // Core account API contract
  accountService?: AccountServiceActions // Optional custom service
  secureStore?: SecureStoreConnector
}

export function createAccountApplication(options: AccountApplicationOptions): AccountApplication {
  const { accountAPI, secureStore, accountService, initialSession } = options

  // Get Zustand store actions
  const storeActions = getAccountActions()

  if (!secureStore) throw new Error('Secure store connector is required for account application')

  if (initialSession) {
    storeActions.setSession(initialSession)
    storeActions.setAccountType(initialSession.accountType)
    storeActions.setIsAuthenticated(true)
  }

  // Helper function to sync store with current session state
  const syncStoreWithSession = async (session: AccountSession | undefined) => {
    if (session) {
      storeActions.setSession(session)
      storeActions.setAccountType(session.accountType)
      storeActions.setIsAuthenticated(true)

      secureStore.write(AUTH_SESSION_KEY, session).catch(error => {
        logger.error('Failed to save session to secure store:', error)
      })
      // Try to load and set account data
      try {
        const accountResult = await accountAPI.getAccount(session)
        if (!accountResult.data) {
          // No account data found - session is invalid
          logger.warn(`[AccountApp] Session exists (accountType: ${session.accountType}) but account not found (accountId: ${session.accountId}). Invalidating session.`)
          await secureStore.delete(AUTH_SESSION_KEY)
          storeActions.clearAccount()
          return
        }
        storeActions.setAccount(accountResult.data)
      } catch (error) {
        logger.error('Failed to load account data for store sync:', error)
      }
    } else {
      // Clear store when no session
      storeActions.clearAccount()
    }
  }

  // Shared promise to deduplicate concurrent loadStoredSession calls
  let loadSessionPromise: Promise<AccountSession | null> | null = null

  // Helper functions
  const loadStoredSession = (): Promise<AccountSession | null> => {
    if (loadSessionPromise) return loadSessionPromise

    loadSessionPromise = (async (): Promise<AccountSession | null> => {
      try {
        const session = await secureStore?.read<AccountSession>(AUTH_SESSION_KEY)
        if (session) {
          // Check if session is expired using business logic
          const expiresAt = new Date(session.expiresAt)
          if (!accountService?.isSessionExpired(expiresAt)) {
            // Sync store with loaded session
            await syncStoreWithSession(session)
            return session
          } else {
            // Session expired, remove it
            await secureStore.delete(AUTH_SESSION_KEY)

            // Sync store to clear expired session
            await syncStoreWithSession(undefined)
          }
        }
      } catch (error) {
        logger.error('Failed to load stored session:', error)
      } finally {
        loadSessionPromise = null
      }
      return null
    })()

    return loadSessionPromise
  }

  // Initialize by loading existing session (async)
  loadStoredSession().catch(error => {
    logger.error('Failed to initialize session store sync:', error)
  })

  return {
    getAccountContext: async function (): Promise<Result<AccountContext>> {
      const session = getSession()
      if (!session) {
        await loadStoredSession()
      }
      return Promise.resolve({
        success: true,
        data: {
          accountId: getAccountId() || '',
          accountType: getAccountType() || 'local_unverified',
          session: getSession() || null,
        },
      })
    },

    requestSMSCode: function (phoneNumber: string, deviceInfo?: AccountDeviceInfo): Promise<Result<SMSCodeRequest>> {
      return accountAPI.requestSMSCode(phoneNumber, deviceInfo)
    },

    verifySMSCode: async function (phoneNumber: string, code: string, deviceInfo?: AccountDeviceInfo): Promise<Result<SMSVerificationResult>> {
      const result = await accountAPI.verifySMSCode(phoneNumber, code, deviceInfo)
      if (result.success && result.data) {
        // If verification is successful, sync store with new session
        await syncStoreWithSession(result.data.context)
      } else {
        logger.error('SMS code verification failed:', result.error)
      }
      return result
    },

    createLocalAccount: async function (deviceInfo?: AccountDeviceInfo): Promise<Result<AccountSession>> {
      const accountSession = await accountAPI.createLocalAccount(deviceInfo)
      syncStoreWithSession(accountSession.data).catch(error => {
        logger.error('Failed to sync store with new account session:', error)
      })
      return accountSession
    },

    validateSession: function (): Promise<Result<SessionValidationResult>> {
      return accountAPI.validateSession(getSession()?.sessionToken || '')
    },

    revokeSession: function (): Promise<Result<void>> {
      return accountAPI.revokeSession(getSession()?.sessionToken || '')
    },

    getAccount: function (): Promise<Result<Account | null>> {
      const session = getSession()
      if (!session) return Promise.resolve({ success: false, data: undefined })
      return accountAPI.getAccount(session)
    },

    updateAccount: async function (data: AccountUpdateData): Promise<Result<Account>> {
      const session = getSession()
      if (!session) return Promise.resolve({ success: false, data: undefined })

      const result = await accountAPI.updateAccount(session, data)
      if (result.success && result.data) {
        storeActions.setAccount(result.data)
      }
      return result
    },

    upgradeToPhoneAccount: function (phoneNumber: string, code: string): Promise<Result<AccountSession>> {
      const session = getSession()
      if (!session) return Promise.resolve({ success: false, data: undefined })
      return accountAPI.upgradeToPhoneAccount(session, phoneNumber, code)
    },

    getFirebaseConfig: function (): Promise<Result<FirebaseConfig>> {
      const session = getSession()
      if (!session) return Promise.resolve({ success: false, data: undefined })
      return accountAPI.getFirebaseConfig(session)
    },

    registerDeviceToken: function (token: string, platform: DevicePlatform): Promise<Result<DeviceToken>> {
      const session = getSession()
      if (!session) return Promise.resolve({ success: false, data: undefined })
      return accountAPI.registerDeviceToken(session, token, platform)
    },

    removeDeviceToken: function (token: string): Promise<Result<void>> {
      const session = getSession()
      if (!session) return Promise.resolve({ success: false, data: undefined })
      return accountAPI.removeDeviceToken(session, token)
    },

    uploadAvatar: async function (base64Data: string): Promise<Result<Account>> {
      const session = getSession()
      if (!session) return Promise.resolve({ success: false, data: undefined })

      const result = await accountAPI.uploadAvatar(session, base64Data)
      if (result.success && result.data) {
        storeActions.setAccount(result.data)
      }
      return result
    },

    getPublicProfile: function (accountId: string): Promise<Result<AccountPublicProfile>> {
      const session = getSession()
      if (!session) return Promise.resolve({ success: false, data: undefined })
      return accountAPI.getPublicProfile(session, accountId)
    },
  }
}

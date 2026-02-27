import { logger } from '@app/shared/utils/logger'
import {
  Account,
  AccountPublicProfile,
  AccountSession,
  AccountUpdateData,
  DevicePlatform,
  DeviceToken,
  FirebaseConfig,
  Result,
  SMSCodeRequest,
  SMSVerificationResult,
} from '@shared/contracts'
import type { ApiClient } from '@shared/ts-rest'
import { SecureStoreConnector } from '../../shared/device/secureStoreConnector'
import { AccountServiceActions } from './services/accountService'
import { getAccountActions, getSession } from './stores/accountStore'

const AUTH_SESSION_KEY = 'authSession'

export interface AccountApplication {
  initializeSession: () => Promise<void>
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
  initialSession?: AccountSession
  api: ApiClient
  accountService?: AccountServiceActions
  secureStore?: SecureStoreConnector
}

export function createAccountApplication(options: AccountApplicationOptions): AccountApplication {
  const { api, secureStore, accountService, initialSession } = options

  const storeActions = getAccountActions()

  if (!secureStore) throw new Error('Secure store connector is required for account application')

  if (initialSession) {
    storeActions.setSession(initialSession)
    storeActions.setAccountType(initialSession.accountType)
    storeActions.setIsAuthenticated(true)
  }

  const syncStoreWithSession = async (session: AccountSession | undefined) => {
    if (session) {
      storeActions.setSession(session)
      storeActions.setAccountType(session.accountType)
      storeActions.setIsAuthenticated(true)

      secureStore.write(AUTH_SESSION_KEY, session).catch(error => {
        logger.error('Failed to save session to secure store:', error)
      })

      try {
        const accountResult = await api.account.getProfile()
        if (!accountResult.data) {
          logger.warn(`[AccountApp] Session exists but account not found. Invalidating session.`)
          await secureStore.delete(AUTH_SESSION_KEY)
          storeActions.clearAccount()
          return
        }
        storeActions.setAccount(accountResult.data)
      } catch (error) {
        logger.error('Failed to load account data for store sync:', error)
      }
    } else {
      storeActions.clearAccount()
    }
  }

  let loadSessionPromise: Promise<AccountSession | null> | null = null

  const loadStoredSession = (): Promise<AccountSession | null> => {
    if (loadSessionPromise) return loadSessionPromise

    loadSessionPromise = (async (): Promise<AccountSession | null> => {
      try {
        const session = await secureStore?.read<AccountSession>(AUTH_SESSION_KEY)
        if (session) {
          const expiresAt = new Date(session.expiresAt)
          if (!accountService?.isSessionExpired(expiresAt)) {
            await syncStoreWithSession(session)
            return session
          } else {
            await secureStore.delete(AUTH_SESSION_KEY)
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

  loadStoredSession().catch(error => {
    logger.error('Failed to initialize session store sync:', error)
  })

  return {
    initializeSession: () => loadStoredSession().then(() => undefined),

    requestSMSCode: (phoneNumber: string) =>
      api.account.requestSMSCode(phoneNumber),

    verifySMSCode: async (phoneNumber: string, code: string) => {
      const result = await api.account.verifySMSCode(phoneNumber, code)
      if (result.success && result.data) {
        await syncStoreWithSession(result.data.context)
      } else {
        logger.error('SMS code verification failed:', result.error)
      }
      return result
    },

    createLocalAccount: async () => {
      const accountSession = await api.account.createLocalAccount()
      syncStoreWithSession(accountSession.data).catch(error => {
        logger.error('Failed to sync store with new account session:', error)
      })
      return accountSession
    },

    validateSession: async () => {
      return api.account.validateSession(getSession()?.sessionToken || '')
    },

    revokeSession: async () => {
      return api.account.revokeSession(getSession()?.sessionToken || '')
    },

    getAccount: async () => {
      const session = getSession()
      if (!session) return { success: false, data: undefined }
      return api.account.getProfile()
    },

    updateAccount: async (data: AccountUpdateData) => {
      const session = getSession()
      if (!session) return { success: false, data: undefined }
      const result = await api.account.updateProfile(data)
      if (result.success && result.data) {
        storeActions.setAccount(result.data)
      }
      return result
    },

    upgradeToPhoneAccount: (phoneNumber: string, code: string) => {
      const session = getSession()
      if (!session) return Promise.resolve({ success: false, data: undefined })
      return api.account.upgradeToPhoneAccount(phoneNumber, code)
    },

    getFirebaseConfig: () => {
      const session = getSession()
      if (!session) return Promise.resolve({ success: false, data: undefined })
      return api.account.getFirebaseConfig()
    },

    registerDeviceToken: (token: string, platform: DevicePlatform) => {
      const session = getSession()
      if (!session) return Promise.resolve({ success: false, data: undefined })
      return api.account.registerDeviceToken(token, platform as 'ios' | 'android' | 'web')
    },

    removeDeviceToken: (token: string) => {
      const session = getSession()
      if (!session) return Promise.resolve({ success: false, data: undefined })
      return api.account.removeDeviceToken(token)
    },

    uploadAvatar: async (base64Data: string) => {
      const session = getSession()
      if (!session) return Promise.resolve({ success: false, data: undefined })
      const result = await api.account.uploadAvatar(base64Data)
      if (result.success && result.data) {
        storeActions.setAccount(result.data)
      }
      return result
    },

    getPublicProfile: (accountId: string) => {
      const session = getSession()
      if (!session) return Promise.resolve({ success: false, data: undefined })
      return api.account.getPublicProfile(accountId)
    },
  }
}

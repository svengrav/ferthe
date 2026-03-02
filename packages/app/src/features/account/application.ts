import { logger } from '@app/shared/utils/logger'
import type { ApiClient } from '@shared/api'
import {
  Account,
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
import { getAccountActions, getSession } from './stores/accountStore'

const AUTH_SESSION_KEY = 'authSession'

export interface AccountApplication {
  initializeSession: () => Promise<void>
  requestSMSCode: (phoneNumber: string) => Promise<Result<SMSCodeRequest>>
  verifySMSCode: (phoneNumber: string, code: string) => Promise<Result<SMSVerificationResult>>
  createLocalAccount: () => Promise<Result<AccountSession>>
  validateSession: () => Promise<Result<SessionValidationResult>>
  revokeSession: () => Promise<Result<void>>
  logout: () => Promise<void>
  getAccount: () => Promise<Result<Account | null>>
  updateAccount: (data: AccountUpdateData) => Promise<Result<Account>>
  upgradeToPhoneAccount: (phoneNumber: string, code: string) => Promise<Result<AccountSession>>
  getFirebaseConfig: () => Promise<Result<FirebaseConfig>>
  registerDeviceToken: (token: string, platform: DevicePlatform) => Promise<Result<DeviceToken>>
  removeDeviceToken: (token: string) => Promise<Result<void>>
  uploadAvatar: (base64Data: string) => Promise<Result<Account>>
  getPublicProfile: (accountId: string) => Promise<Result<AccountPublicProfile>>
  listPublicProfiles: (accountIds: string[]) => Promise<Result<AccountPublicProfile[]>>
  deleteAccount: () => Promise<Result<void>>
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
    storeActions.setRole(initialSession.role ?? null)
    storeActions.setIsAuthenticated(true)
  }

  const syncStoreWithSession = async (session: AccountSession | undefined, invalidateOnMissingAccount = false) => {
    logger.log('[AccountApp] syncStoreWithSession called', { hasSession: !!session, accountId: session?.accountId })
    if (session) {
      storeActions.setSession(session)
      storeActions.setAccountType(session.accountType)
      storeActions.setRole(session.role ?? null)
      storeActions.setIsAuthenticated(true)
      logger.log('[AccountApp] Store updated with session', { accountType: session.accountType, isAuthenticated: true })

      secureStore.write(AUTH_SESSION_KEY, session).catch(error => {
        logger.error('Failed to save session to secure store:', error)
      })

      try {
        const accountResult = await api.account.getProfile()
        logger.log('[AccountApp] getProfile result', { success: accountResult.success, hasData: !!accountResult.data, error: accountResult.error })
        if (!accountResult.data) {
          if (invalidateOnMissingAccount) {
            logger.warn(`[AccountApp] Session exists but account not found. Invalidating session.`)
            await secureStore.delete(AUTH_SESSION_KEY)
            storeActions.clearAccount()
          } else {
            logger.warn(`[AccountApp] Could not load profile after login — keeping session.`)
          }
          return
        }
        storeActions.setAccount(accountResult.data)
      } catch (error) {
        logger.error('Failed to load account data for store sync:', error)
      }
    } else {
      logger.log('[AccountApp] syncStoreWithSession: clearing account (no session)')
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
            await syncStoreWithSession(session, true)
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
    listPublicProfiles: (accountIds: string[]) => {
      return api.account.getPublicProfiles(accountIds)
    },

    initializeSession: () => loadStoredSession().then(() => undefined),

    requestSMSCode: (phoneNumber: string) =>
      api.account.requestSMSCode(phoneNumber),

    verifySMSCode: async (phoneNumber: string, code: string) => {
      const result = await api.account.verifySMSCode(phoneNumber, code)

      if (result.success && result.data?.context) {
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
      const result = await api.account.validateSession(getSession()?.sessionToken || '')
      if (!result.success || !result.data) {
        return { success: false, error: result.error }
      }
      // Map AccountSession to SessionValidationResult
      return {
        success: true,
        data: {
          accountId: result.data.accountId,
          valid: true,
          role: result.data.role,
          accountType: result.data.accountType,
          client: result.data.client,
        },
      }
    },

    revokeSession: async () => {
      return api.account.revokeSession(getSession()?.sessionToken || '')
    },

    logout: async () => {
      const token = getSession()?.sessionToken
      if (token) await api.account.revokeSession(token)
      await secureStore.delete(AUTH_SESSION_KEY)
      storeActions.setSession(null)
      storeActions.setAccount(null)
      storeActions.setIsAuthenticated(false)
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

    upgradeToPhoneAccount: async (phoneNumber: string, code: string) => {
      const session = getSession()
      if (!session) return Promise.resolve({ success: false, data: undefined })
      const result = await api.account.upgradeToPhoneAccount(phoneNumber, code)
      if (result.success && result.data) {
        await syncStoreWithSession(result.data)
      }
      return result
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

    deleteAccount: async () => {
      const session = getSession()
      if (!session) return Promise.resolve({ success: false, data: undefined })
      const result = await api.account.deleteAccount()
      if (result.success) {
        await secureStore.delete(AUTH_SESSION_KEY)
        storeActions.setSession(null)
        storeActions.setAccount(null)
        storeActions.setIsAuthenticated(false)
      }
      return result
    },
  }
}

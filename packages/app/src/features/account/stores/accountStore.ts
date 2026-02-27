import { Status, StoreActions, StoreState } from '@app/shared/stores/types'
import { Account, AccountRole, AccountSession, AccountType } from '@shared/contracts'
import { create } from 'zustand'

interface AccountActions extends StoreActions {
  setAccountId: (accountId: string | undefined) => void
  setAccount: (account: Account | null) => void
  setSession: (session: AccountSession | null) => void
  setAccountType: (accountType: AccountType | null) => void
  setRole: (role: AccountRole | null) => void
  setIsAuthenticated: (isAuthenticated: boolean) => void
  clearAccount: () => void
}

interface AccountState extends StoreState {
  status: Status
  accountId: string | undefined,
  account: Account | null
  session: AccountSession | null
  accountType: AccountType | null
  role: AccountRole | null
  isAuthenticated: boolean
  isPhoneVerified: boolean
}

export const accountStore = create<AccountState & AccountActions>(set => ({
  // Metadata
  updatedAt: new Date(0),
  status: 'uninitialized',
  error: undefined,

  // Account specific data
  accountId: undefined,
  account: null,
  session: null,
  accountType: null,
  role: null,
  isAuthenticated: false,
  isPhoneVerified: false,

  // Actions
  setStatus: status =>
    set({ status }),

  setAccount: account =>
    set(state => ({
      account: account ? { ...state.account, ...account } : null,
      accountId: account?.id,
      isPhoneVerified: account?.isPhoneVerified ?? false,
      updatedAt: new Date()
    })),

  setAccountId: accountId =>
    set({
      accountId,
      updatedAt: new Date()
    }),

  setSession: session =>
    set({
      accountId: session?.accountId,
      session,
      isAuthenticated: session !== null,
      updatedAt: new Date()
    }),

  setAccountType: accountType =>
    set({
      accountType,
      updatedAt: new Date()
    }),

  setRole: role =>
    set({
      role,
      updatedAt: new Date()
    }),

  setIsAuthenticated: isAuthenticated =>
    set({
      isAuthenticated,
      updatedAt: new Date()
    }),

  clearAccount: () =>
    set({
      account: null,
      session: null,
      accountType: null,
      role: null,
      isAuthenticated: false,
      isPhoneVerified: false,
      updatedAt: new Date()
    })
}))

// Hook selectors for performance optimization
export const useAccountStatus = () => accountStore(state => state.status)
export const useAccount = () => accountStore(state => state.account)
export const useAccountId = () => accountStore(state => state.account?.id)
export const useAccountType = () => accountStore(state => state.accountType)
export const useAccountRole = () => accountStore(state => state.role)
export const useIsAuthenticated = () => accountStore(state => state.isAuthenticated)
export const useIsPhoneVerified = () => accountStore(state => state.isPhoneVerified)
export const useSession = () => accountStore(state => state.session)
export const useAccountData = () => accountStore(state => state)

// Direct state access (for use outside React components)
export const getAccount = () => accountStore.getState().account
export const getAccountId = () => accountStore.getState().accountId
export const getAccountType = () => accountStore.getState().accountType
export const getAccountRole = () => accountStore.getState().role
export const getSession = () => accountStore.getState().session
export const getIsAuthenticated = () => accountStore.getState().isAuthenticated
export const getAccountData = () => accountStore.getState()

// Action getters
export const getAccountActions = () => ({
  setAccount: accountStore.getState().setAccount,
  setSession: accountStore.getState().setSession,
  setAccountType: accountStore.getState().setAccountType,
  setRole: accountStore.getState().setRole,
  setIsAuthenticated: accountStore.getState().setIsAuthenticated,
  clearAccount: accountStore.getState().clearAccount,
  setStatus: accountStore.getState().setStatus,
})
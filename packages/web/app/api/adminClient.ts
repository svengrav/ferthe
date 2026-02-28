/**
 * Admin API client — backed by the shared ts-rest facade.
 * Auth token management is kept here; the facade handles all HTTP calls.
 */

import { createApiClient } from '@shared/orpc'

// ── Token management ───────────────────────────────────────────────────────────

const ADMIN_TOKEN_KEY = 'ferthe_admin_token'
const ADMIN_ACCOUNT_ID_KEY = 'ferthe_admin_account_id'
const ADMIN_ROLE_KEY = 'ferthe_admin_role'

export const setAdminToken = (token: string) =>
  localStorage.setItem(ADMIN_TOKEN_KEY, token)

export const getAdminToken = (): string | null =>
  localStorage.getItem(ADMIN_TOKEN_KEY)

export const clearAdminToken = () => {
  localStorage.removeItem(ADMIN_TOKEN_KEY)
  localStorage.removeItem(ADMIN_ACCOUNT_ID_KEY)
  localStorage.removeItem(ADMIN_ROLE_KEY)
}

export const setAdminAccountId = (accountId: string) =>
  localStorage.setItem(ADMIN_ACCOUNT_ID_KEY, accountId)

export const getAdminAccountId = (): string | null =>
  localStorage.getItem(ADMIN_ACCOUNT_ID_KEY)

export const setAdminRole = (role: string) =>
  localStorage.setItem(ADMIN_ROLE_KEY, role)

export const getAdminRole = (): string | null =>
  localStorage.getItem(ADMIN_ROLE_KEY)

// ── API clients ────────────────────────────────────────────────────────────────

export const api = createApiClient({
  baseUrl: '/core/api/v1',
  getAuthToken: getAdminToken,
})

export const contentApi = createApiClient({ baseUrl: '/core/api/v1' })

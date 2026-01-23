import { AccountSession } from '@shared/contracts/accounts.js';
import { deserializeDates, fetchWithTimeout } from './utils';

// Base API Client Factory
export const createAPIClient = (apiEndpoint: string, getAccountSession: () => AccountSession | null, timeout: number = 10000) => {
  const send = async <T>(endpoint: string, method: string = 'GET', body?: any): Promise<T> => {
    const credentials = getAccountSession()

    const headers: HeadersInit = {}
    if (body) {
      headers['Content-Type'] = 'application/json'
    }

    if (credentials?.sessionToken) {
      headers['Authorization'] = `Bearer ${credentials.sessionToken}`
    }

    const response = await fetchWithTimeout(`${apiEndpoint}${endpoint}`, {
      method: method.toUpperCase(),
      headers,
      body: body ? JSON.stringify(body) : null,
      timeout,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const json = await response.json()
    return deserializeDates<T>(json)
  }

  return { send }
}

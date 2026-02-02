import { setNotification } from '@app/shared/components/notification/Notification';
import { AccountSession } from '@shared/contracts/accounts.js';
import { Result } from '@shared/contracts/results.js';
import { deserializeDates, fetchWithTimeout } from './utils';

// Helper: Show connection error notification
let lastConnectionErrorTime = 0
const CONNECTION_ERROR_DEBOUNCE = 5000 // 5 seconds

export const showConnectionError = () => {
  const now = Date.now()
  if (now - lastConnectionErrorTime < CONNECTION_ERROR_DEBOUNCE) return

  lastConnectionErrorTime = now
  setNotification('Connection Error', 'Unable to reach the server. Please check your internet connection and try again.')
}

// Error types for classification
export type APIErrorType = 'connection' | 'timeout' | 'http' | 'unknown'

export interface APIError extends Error {
  type: APIErrorType
  statusCode?: number
}

// Base API Client Factory
export const createAPIClient = (
  apiEndpoint: string,
  getAccountSession: () => AccountSession | null,
  timeout: number = 10000,
) => {
  const send = async <T>(endpoint: string, method: string = 'GET', body?: any): Promise<Result<T>> => {
    try {
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
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as APIError
        error.type = 'http'
        error.statusCode = response.status

        return {
          success: false,
          error: {
            message: error.message,
            code: `HTTP_${response.status}`,
          }
        }
      }

      const json = await response.json()
      const data = deserializeDates<T>(json)

      // Return data directly as Result<T>
      return data as Result<T>
    } catch (error: any) {
      // Classify error type
      const apiError = error as APIError

      if (!apiError.type) {
        if (error.message?.includes('timeout')) {
          apiError.type = 'timeout'
        } else if (error.message?.includes('Network') || error.message?.includes('fetch')) {
          apiError.type = 'connection'
        } else {
          apiError.type = 'unknown'
        }
      }

      // Notify on connection errors
      if (apiError.type === 'connection' || apiError.type === 'timeout') {
        showConnectionError()
      }

      return {
        success: false,
        error: {
          message: apiError.message,
          code: apiError.type.toUpperCase(),
        }
      }
    }
  }

  return { send }
}

import { AccountSession } from '@shared/contracts/accounts.js';
import { Result } from '@shared/contracts/results.js';
import { deserializeDates, fetchWithTimeout } from './utils';

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
  const send = async <T>(endpoint: string, method: string = 'GET', body?: any, queryParams?: Record<string, string>): Promise<Result<T>> => {
    try {
      const credentials = getAccountSession()

      // Build URL with query parameters
      let url = `${apiEndpoint}${endpoint}`
      if (queryParams) {
        const entries = Object.entries(queryParams).filter(([, v]) => v !== undefined && v !== '')
        if (entries.length > 0) {
          url += '?' + new URLSearchParams(entries).toString()
        }
      }

      const headers: HeadersInit = {}
      if (body) {
        headers['Content-Type'] = 'application/json'
      }

      if (credentials?.sessionToken) {
        headers['Authorization'] = `Bearer ${credentials.sessionToken}`
      }


      const response = await fetchWithTimeout(url, {
        method: method.toUpperCase(),
        headers,
        body: body ? JSON.stringify(body) : null,
        timeout,
      })

      if (!response.ok) {
        let code = `HTTP_${response.status}`
        let message = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorJson = await response.json()
          if (errorJson?.error?.code) code = errorJson.error.code
          if (errorJson?.error?.message) message = errorJson.error.message
        } catch { /* ignore parse errors */ }

        return {
          success: false,
          error: { code, message },
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

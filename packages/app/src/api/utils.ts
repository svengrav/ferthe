/**
 * API Utility Functions
 */

import { QueryOptions } from '@shared/contracts'

export interface FetchWithTimeoutOptions extends RequestInit {
  timeout?: number
}

/**
 * Fetch with timeout using AbortController
 */
export const fetchWithTimeout = async (
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> => {
  const { timeout = 10000, ...fetchOptions } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`)
    }
    throw error
  }
}

/**
 * Known date field names that should be deserialized from ISO strings to Date objects
 */
const DATE_FIELDS = ['createdAt', 'updatedAt', 'joinedAt', 'discoveredAt', 'timestamp']

/**
 * Deserializes ISO date strings to Date objects in API responses
 */
export const deserializeDates = <T>(data: any): T => {
  if (!data || typeof data !== 'object') {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(item => deserializeDates(item)) as T
  }

  const result: any = {}
  for (const key in data) {
    const value = data[key]

    // Convert known date fields from ISO strings to Date objects
    if (DATE_FIELDS.includes(key) && typeof value === 'string') {
      try {
        result[key] = new Date(value)
      } catch {
        result[key] = value
      }
    } else if (typeof value === 'object' && value !== null) {
      result[key] = deserializeDates(value)
    } else {
      result[key] = value
    }
  }

  return result as T
}

/**
 * Serializes QueryOptions into flat query parameter key-value pairs.
 * Counterpart to core's parseQueryOptions.
 */
export const serializeQueryOptions = (options?: QueryOptions): Record<string, string> => {
  if (!options) return {}

  const params: Record<string, string> = {}

  if (options.limit !== undefined) params.limit = String(options.limit)
  if (options.offset !== undefined) params.offset = String(options.offset)
  if (options.sortBy) params.sortBy = options.sortBy
  if (options.sortOrder) params.sortOrder = options.sortOrder
  if (options.search) params.search = options.search
  if (options.include?.length) params.include = options.include.join(',')
  if (options.exclude?.length) params.exclude = options.exclude.join(',')

  return params
}

export interface StatusResult {
  available: boolean
  latency?: number
  error?: string
}

export const checkStatus = async (endpoint: string): Promise<StatusResult> => {
  const startTime = Date.now()

  try {
    const response = await fetchWithTimeout(endpoint, {
      method: 'GET',
      timeout: 5000,
    })

    const latency = Date.now() - startTime

    if (!response.ok) {
      return {
        available: false,
        latency,
        error: `HTTP ${response.status}`,
      }
    }

    return {
      available: true,
      latency,
    }
  } catch (error: any) {
    return {
      available: false,
      latency: Date.now() - startTime,
      error: error.message,
    }
  }
}


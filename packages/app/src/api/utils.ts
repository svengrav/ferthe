/**
 * API Utility Functions
 */

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


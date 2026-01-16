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

export interface StatusResult {
  available: boolean
  latency?: number
  error?: string
}

/**
 * Check API health with quick timeout
 */
export const checkAPIHealth = async (
  apiEndpoint: string,
  timeout: number = 5000
): Promise<StatusResult> => {
  const startTime = Date.now()

  try {
    const response = await fetchWithTimeout(`${apiEndpoint}/v1/health`, {
      method: 'GET',
      timeout,
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

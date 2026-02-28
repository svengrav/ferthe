/**
 * HTTP Client
 * Simple fetch wrapper for Oak REST API
 */

export interface HttpClientConfig {
  baseUrl: string
  getAuthToken?: () => string | null | undefined
}

export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: unknown
  query?: Record<string, string | number | boolean | undefined>
}

export class HttpClient {
  constructor(private config: HttpClientConfig) { }

  async request<T = any>(path: string, options: HttpRequestOptions = {}): Promise<T> {
    const { method = 'GET', body, query } = options
    const { baseUrl, getAuthToken } = this.config

    // Build URL with query params
    let url = `${baseUrl}${path}`
    if (query) {
      const params = new URLSearchParams()
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value))
        }
      })
      const queryString = params.toString()
      if (queryString) {
        url += `?${queryString}`
      }
    }

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    const token = getAuthToken?.()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // Make request
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    // Parse response
    const json = await response.json()

    if (!response.ok) {
      // Return the error object from the server (already in Result format)
      return json as T
    }

    return json.data as T
  }

  get<T = any>(path: string, query?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>(path, { method: 'GET', query })
  }

  post<T = any>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'POST', body })
  }

  put<T = any>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PUT', body })
  }

  delete<T = any>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'DELETE', body })
  }
}

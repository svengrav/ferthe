/**
 * HTTP Client
 * Simple fetch wrapper for Oak REST API
 */

import type { Result } from '../contracts/results.ts'

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

  async request<T = any>(path: string, options: HttpRequestOptions = {}): Promise<Result<T>> {
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

    // Parse response — server always returns Result<T> envelope
    const json = await response.json()
    return json as Result<T>
  }

  get<T = any>(path: string, query?: Record<string, string | number | boolean | undefined>): Promise<Result<T>> {
    return this.request<T>(path, { method: 'GET', query })
  }

  post<T = any>(path: string, body?: unknown): Promise<Result<T>> {
    return this.request<T>(path, { method: 'POST', body })
  }

  put<T = any>(path: string, body?: unknown): Promise<Result<T>> {
    return this.request<T>(path, { method: 'PUT', body })
  }

  delete<T = any>(path: string, body?: unknown): Promise<Result<T>> {
    return this.request<T>(path, { method: 'DELETE', body })
  }
}

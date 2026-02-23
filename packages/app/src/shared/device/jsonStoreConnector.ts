import { logger } from '../utils/logger'
import { SecureStoreConnector } from './secureStoreConnector'

interface JsonStoreConnectorOptions {
  storageServerUrl?: string // URL of the local storage server
}

/**
 * HTTP-based JSON file implementation of SecureStoreConnector
 * Communicates with a local Fastify server that stores data as JSON files
 * Works across web, mobile, and desktop platforms
 */
export class JsonStoreConnector implements SecureStoreConnector {
  private readonly storageServerUrl: string

  constructor(options: JsonStoreConnectorOptions = {}) {
    // Default to local storage server
    this.storageServerUrl = options.storageServerUrl || 'http://localhost:3010'
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${this.storageServerUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null as T
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      logger.error(`Storage request failed for ${endpoint}:`, error)
      throw error
    }
  }

  async read<T = string>(key: string): Promise<T | null> {
    try {
      const response = await this.makeRequest<{ success: boolean; data: T }>(`/storage/${encodeURIComponent(key)}`)
      const data = response?.data || null
      // Serialize back to string for Zustand persist compatibility
      return data ? JSON.stringify(data) as T : null
    } catch (error) {
      logger.error(`Failed to read from JSON store with key: ${key}`, error)
      return null
    }
  }

  async write<T>(key: string, value: T): Promise<void> {
    try {
      // Parse string values (from Zustand persist) to avoid double-serialization
      const payload = typeof value === 'string' ? JSON.parse(value) : value
      await this.makeRequest(`/storage/${encodeURIComponent(key)}`, {
        method: 'POST',
        body: JSON.stringify({ value: payload }),
      })
    } catch (error) {
      logger.error(`Failed to write to JSON store with key: ${key}`, error)
      throw error
    }
  }

  async update<T>(key: string, value: T): Promise<void> {
    return this.write(key, value)
  }

  async delete(key: string): Promise<void> {
    try {
      await this.makeRequest(`/storage/${encodeURIComponent(key)}`, {
        method: 'DELETE',
      })
    } catch (error) {
      logger.error(`Failed to delete from JSON store with key: ${key}`, error)
      throw error
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const response = await this.makeRequest<{ success: boolean; exists: boolean }>(`/storage/${encodeURIComponent(key)}/exists`)
      return response?.exists || false
    } catch (error) {
      logger.error(`Failed to check existence in JSON store with key: ${key}`, error)
      return false
    }
  }
  /**
   * Additional methods for debugging and maintenance
   */

  /**
   * Clear all stored data
   */
  async clear(): Promise<void> {
    try {
      await this.makeRequest('/storage', {
        method: 'DELETE',
      })
    } catch (error) {
      logger.error('Failed to clear JSON store:', error)
      throw error
    }
  }

  /**
   * Get all stored keys (for debugging)
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const response = await this.makeRequest<{ success: boolean; keys: string[] }>('/storage')
      return response?.keys || []
    } catch (error) {
      logger.error('Failed to get all keys from JSON store:', error)
      return []
    }
  }

  /**
   * Get the number of stored items
   */
  async size(): Promise<number> {
    try {
      const keys = await this.getAllKeys()
      return keys.length
    } catch (error) {
      logger.error('Failed to get JSON store size:', error)
      return 0
    }
  }

  /**
   * Get storage info for debugging
   */
  async getStorageInfo(): Promise<{
    serverUrl: string
    size: number
    keys: string[]
  }> {
    try {
      const keys = await this.getAllKeys()

      return {
        serverUrl: this.storageServerUrl,
        size: keys.length,
        keys
      }
    } catch (error) {
      logger.error('Failed to get storage info:', error)
      return {
        serverUrl: this.storageServerUrl,
        size: 0,
        keys: []
      }
    }
  }
}

/**
 * Singleton instance for easy usage
 */
export const jsonStoreConnector = new JsonStoreConnector()
import { logger } from '@app/shared/utils/logger'
import { SecureStoreConnector } from './secureStoreConnector'

/**
 * Memory-based implementation of SecureStoreConnector for testing
 * Stores data in memory - data will be lost when app is closed/restarted
 */
export class MemoryStoreConnector implements SecureStoreConnector {
  private storage: Map<string, string> = new Map()

  async read<T = string>(key: string): Promise<T | null> {
    try {
      const rawValue = this.storage.get(key)
      if (rawValue === undefined) {
        return null
      }

      if (typeof rawValue === 'string' && rawValue.length > 0) {
        try {
          return JSON.parse(rawValue) as T
        } catch {
          // If JSON parsing fails, return as string (for backward compatibility)
          return rawValue as T
        }
      }

      return null
    } catch (error) {
      logger.error(`Failed to read from memory store with key: ${key}`, error)
      return null
    }
  }

  async write<T>(key: string, value: T): Promise<void> {
    try {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value)
      this.storage.set(key, serializedValue)
    } catch (error) {
      logger.error(`Failed to write to memory store with key: ${key}`, error)
      throw error
    }
  }

  async update<T>(key: string, value: T): Promise<void> {
    return this.write(key, value)
  }

  async delete(key: string): Promise<void> {
    try {
      this.storage.delete(key)
    } catch (error) {
      logger.error(`Failed to delete from memory store with key: ${key}`, error)
      throw error
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return this.storage.has(key)
    } catch (error) {
      logger.error(`Failed to check existence in memory store with key: ${key}`, error)
      return false
    }
  }

  /**
   * Additional methods for testing/debugging
   */

  /**
   * Clear all stored data
   */
  clear(): void {
    this.storage.clear()
  }

  /**
   * Get all stored keys (for debugging)
   */
  getAllKeys(): string[] {
    return Array.from(this.storage.keys())
  }

  /**
   * Get the number of stored items
   */
  size(): number {
    return this.storage.size
  }
}

/**
 * Singleton instance for easy usage
 */
export const memoryStoreConnector = new MemoryStoreConnector()

export const getMemoryStoreConnector = () => memoryStoreConnector

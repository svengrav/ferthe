import * as SecureStore from 'expo-secure-store'

/**
 * Interface for secure storage operations with generic JSON support
 */
export interface SecureStoreConnector {
  /**
   * Read and deserialize a value from secure storage
   * @param key - The key to read
   * @returns Promise<T | null> - The deserialized value or null if not found
   */
  read<T = string>(key: string): Promise<T | null>

  /**
   * Serialize and write a value to secure storage
   * @param key - The key to store under
   * @param value - The value to store (will be JSON serialized)
   * @returns Promise<void>
   */
  write<T>(key: string, value: T): Promise<void>

  /**
   * Update a value in secure storage (alias for write)
   * @param key - The key to update
   * @param value - The new value (will be JSON serialized)
   * @returns Promise<void>
   */
  update<T>(key: string, value: T): Promise<void>

  /**
   * Delete a value from secure storage
   * @param key - The key to delete
   * @returns Promise<void>
   */
  delete(key: string): Promise<void>

  /**
   * Check if a key exists in secure storage
   * @param key - The key to check
   * @returns Promise<boolean> - True if key exists
   */
  exists(key: string): Promise<boolean>
}

/**
 * Secure storage wrapper implementation using Expo SecureStore with JSON support
 */
export const secureStoreConnector: SecureStoreConnector = {
  async read<T = string>(key: string): Promise<T | null> {
    try {
      const rawValue = await SecureStore.getItemAsync(key)
      if (rawValue === null) {
        return null
      }
      
      // If T is string, return raw value
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
      console.error(`Failed to read from secure store with key: ${key}`, error)
      return null
    }
  },

  async write<T>(key: string, value: T): Promise<void> {
    try {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value)
      await SecureStore.setItemAsync(key, serializedValue)
    } catch (error) {
      console.error(`Failed to write to secure store with key: ${key}`, error)
      throw error
    }
  },

  async update<T>(key: string, value: T): Promise<void> {
    return this.write(key, value)
  },

  async delete(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key)
    } catch (error) {
      console.error(`Failed to delete from secure store with key: ${key}`, error)
      throw error
    }
  },

  async exists(key: string): Promise<boolean> {
    try {
      const value = await SecureStore.getItemAsync(key)
      return value !== null
    } catch (error) {
      console.error(`Failed to check existence in secure store with key: ${key}`, error)
      return false
    }
  }
}

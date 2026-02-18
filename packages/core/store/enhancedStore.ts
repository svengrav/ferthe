import { QueryOptions } from '@shared/contracts/index.ts'
import { StoreInterface, StoreItem } from './storeInterface.ts'

export interface StoreOperationResult<T> {
  success: boolean
  data?: T
  code?: 'CREATED' | 'ALREADY_EXISTS' | 'NOT_FOUND' | 'ERROR' | 'UPDATED' | 'DELETED'
  message?: string
}

/**
 * Enhanced store service that wraps basic store operations with Result pattern
 * Provides consistent error handling and operation feedback across all store implementations
 */
export interface EnhancedStoreInterface {
  create<T extends StoreItem>(container: string, item: T): Promise<StoreOperationResult<T>>
  get<T extends StoreItem>(container: string, id: string): Promise<StoreOperationResult<T>>
  list<T extends StoreItem>(container: string, options?: QueryOptions): Promise<StoreOperationResult<T[]>>
  update<T extends StoreItem>(container: string, id: string, item: Partial<T>): Promise<StoreOperationResult<T>>
  delete(container: string, id: string): Promise<StoreOperationResult<void>>
  deleteAll(container: string): Promise<StoreOperationResult<void>>
}

/**
 * Creates an enhanced store wrapper that provides Result pattern for all operations
 */
export const createEnhancedStore = (baseStore: StoreInterface): EnhancedStoreInterface => {
  return {
    async create<T extends StoreItem>(container: string, item: T): Promise<StoreOperationResult<T>> {
      try {
        const result = await baseStore.create(container, item)
        return {
          success: true,
          data: result,
          code: 'CREATED',
        }
      } catch (error: any) {
        // Handle duplicate error specifically
        if (error.message?.includes('already exists')) {
          return {
            success: false,
            code: 'ALREADY_EXISTS',
            message: `Item with id ${item.id} already exists`,
          }
        }

        return {
          success: false,
          code: 'ERROR',
          message: error.message || 'Unknown error occurred during create operation',
        }
      }
    },

    async get<T extends StoreItem>(container: string, id: string): Promise<StoreOperationResult<T>> {
      try {
        const result = await baseStore.get<T>(container, id)
        if (result) {
          return {
            success: true,
            data: result,
          }
        } else {
          return {
            success: false,
            code: 'NOT_FOUND',
            message: `Item with id ${id} not found`,
          }
        }
      } catch (error: any) {
        return {
          success: false,
          code: 'ERROR',
          message: error.message || 'Unknown error occurred during get operation',
        }
      }
    },

    async list<T extends StoreItem>(container: string, options?: QueryOptions): Promise<StoreOperationResult<T[]>> {
      try {
        const result = await baseStore.list<T>(container, options)
        return {
          success: true,
          data: result,
        }
      } catch (error: any) {
        return {
          success: false,
          code: 'ERROR',
          message: error.message || 'Unknown error occurred during list operation',
        }
      }
    },

    async update<T extends StoreItem>(container: string, id: string, item: Partial<T>): Promise<StoreOperationResult<T>> {
      try {
        const result = await baseStore.update<T>(container, id, item)
        if (result) {
          return {
            success: true,
            data: result,
            code: 'UPDATED',
          }
        } else {
          return {
            success: false,
            code: 'NOT_FOUND',
            message: `Item with id ${id} not found for update`,
          }
        }
      } catch (error: any) {
        return {
          success: false,
          code: 'ERROR',
          message: error.message || 'Unknown error occurred during update operation',
        }
      }
    },

    async delete(container: string, id: string): Promise<StoreOperationResult<void>> {
      try {
        await baseStore.delete(container, id)
        return {
          success: true,
          code: 'DELETED',
        }
      } catch (error: any) {
        return {
          success: false,
          code: 'ERROR',
          message: error.message || 'Unknown error occurred during delete operation',
        }
      }
    },

    async deleteAll(container: string): Promise<StoreOperationResult<void>> {
      try {
        await baseStore.deleteAll(container)
        return {
          success: true,
          code: 'DELETED',
        }
      } catch (error: any) {
        return {
          success: false,
          code: 'ERROR',
          message: error.message || 'Unknown error occurred during deleteAll operation',
        }
      }
    },
  }
}

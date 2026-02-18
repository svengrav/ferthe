import { QueryOptions } from '@shared/contracts/index.ts'

export interface StoreItem {
  id: string
}

/**
 * Unified store interface for handling collections
 * Works with both cosmos and memory implementations
 */
export interface StoreInterface {
  create<T extends StoreItem>(container: string, item: T): Promise<T>
  get<T extends StoreItem>(container: string, id: string): Promise<T | undefined>
  list<T extends StoreItem>(container: string, options?: QueryOptions): Promise<T[]>
  update<T extends StoreItem>(container: string, id: string, item: Partial<T>): Promise<T | undefined>
  delete(container: string, id: string): Promise<void>
  deleteAll(container: string): Promise<void>
}

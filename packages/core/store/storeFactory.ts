import { QueryOptions } from '@shared/contracts/index.ts'
import { createCosmosStore } from './cosmosStore.ts'
import { createEnhancedStore, StoreOperationResult } from './enhancedStore.ts'
import { createJsonStore } from './jsonStore.ts'
import { createMemoryStore } from './memoryStore.ts'
import { StoreInterface, StoreItem } from './storeInterface.ts'

export interface Store<T extends StoreItem> {
  create(item: T): Promise<StoreOperationResult<T>>
  get(id: string): Promise<StoreOperationResult<T>>
  update(id: string, item: Partial<T>): Promise<StoreOperationResult<T>>
  delete(id: string): Promise<StoreOperationResult<void>>
  list(options?: QueryOptions): Promise<StoreOperationResult<T[]>>
}

export type STORE_TYPES = 'memory' | 'cosmos' | 'json'

export type COSMOS_CONFIG = {
  connectionString: string
  database: string
}

export type JSON_CONFIG = {
  baseDirectory: string
}

export function createStoreConnector(type?: STORE_TYPES, options?: COSMOS_CONFIG | JSON_CONFIG): StoreInterface {
  if (type === 'memory') {
    return createMemoryStore()
  }
  if (type === 'cosmos') {
    return createCosmosStore(options as COSMOS_CONFIG)
  }
  if (type === 'json') {
    return createJsonStore(options as JSON_CONFIG)
  }
  return createMemoryStore()
}

export function createStore<T extends StoreItem>(connector: StoreInterface, container: string): Store<T> {
  const enhancedStore = createEnhancedStore(connector)

  return {
    create: (item: T) => enhancedStore.create<T>(container, item),
    get: (id: string) => enhancedStore.get<T>(container, id),
    update: (id: string, item: T) => enhancedStore.update<T>(container, id, item),
    delete: (id: string) => enhancedStore.delete(container, id),
    list: (options?: QueryOptions) => enhancedStore.list<T>(container, options),
  }
}

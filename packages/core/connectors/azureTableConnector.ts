import { TableClient, TableServiceClient } from '@azure/data-tables'

interface TableRecord {
  id: string
}

interface TableClientCache {
  [tableName: string]: TableClient
}

export interface AzureTableConnector {
  createItem<T extends TableRecord>(tableName: string, item: T): Promise<T>
  getItem<T extends TableRecord>(tableName: string, id: string): Promise<T | undefined>
  queryItems<T>(tableName: string, filter?: string): Promise<T[]>
  replaceItem<T extends TableRecord>(tableName: string, id: string, item: T): Promise<T>
  deleteItem(tableName: string, id: string): Promise<void>
  createTableIfNotExists(tableName: string): Promise<void>
}

export function createAzureTableConnector(connectionString: string): AzureTableConnector {
  if (!connectionString) {
    throw new Error('Azure Table Storage connectionString is required')
  }

  const serviceClient = TableServiceClient.fromConnectionString(connectionString)
  const tableCache: TableClientCache = {}

  async function getTableClient(tableName: string): Promise<TableClient> {
    if (tableCache[tableName]) {
      return tableCache[tableName]
    }

    await createTableIfNotExists(tableName)
    const client = TableClient.fromConnectionString(connectionString, tableName)
    tableCache[tableName] = client
    return client
  }

  async function createTableIfNotExists(tableName: string): Promise<void> {
    try {
      await serviceClient.createTable(tableName)
    } catch (error: any) {
      // Table already exists - ignore error
      if (error?.statusCode !== 409) {
        throw error
      }
    }
  }

  function toTableEntity<T extends TableRecord>(tableName: string, item: T) {
    const entity = {
      partitionKey: tableName,
      rowKey: item.id,
    } as any

    // Copy all properties from item
    for (const [key, value] of Object.entries(item)) {
      entity[key] = value
    }

    return entity
  }

  function fromTableEntity<T>(entity: Record<string, unknown>): T {
    const { partitionKey, rowKey, timestamp, etag, ...rest } = entity
    return rest as T
  }

  async function createItem<T extends TableRecord>(tableName: string, item: T): Promise<T> {
    const client = await getTableClient(tableName)
    const entity = toTableEntity(tableName, item)
    await client.createEntity(entity)
    return item
  }

  async function getItem<T extends TableRecord>(tableName: string, id: string): Promise<T | undefined> {
    try {
      const client = await getTableClient(tableName)
      const response = await client.getEntity(tableName, id)
      return fromTableEntity<T>(response as Record<string, unknown>)
    } catch (error: any) {
      if (error?.statusCode === 404) {
        return undefined
      }
      throw error
    }
  }

  async function queryItems<T>(tableName: string, filter?: string): Promise<T[]> {
    const client = await getTableClient(tableName)
    const queryOptions = filter ? { queryOptions: { filter } } : undefined
    const entities = client.listEntities(queryOptions)

    const results: T[] = []
    for await (const entity of entities) {
      results.push(fromTableEntity<T>(entity as Record<string, unknown>))
    }
    return results
  }

  async function replaceItem<T extends TableRecord>(tableName: string, id: string, item: T): Promise<T> {
    const client = await getTableClient(tableName)
    const entity = toTableEntity(tableName, item)
    await client.updateEntity(entity, 'Replace')
    return item
  }

  async function deleteItem(tableName: string, id: string): Promise<void> {
    const client = await getTableClient(tableName)
    await client.deleteEntity(tableName, id)
  }

  return {
    createItem,
    getItem,
    queryItems,
    replaceItem,
    deleteItem,
    createTableIfNotExists,
  }
}

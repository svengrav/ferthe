import { CosmosClient, Container } from '@azure/cosmos'

// Define a base interface that requires an id property
interface CosmosRecord {
  id: string
}

interface QueryOptions {
  maxItemCount?: number
  continuationToken?: string | null
}

interface QueryResult<T> {
  items: T[]
  continuationToken: string | null
}

interface CosmosConfig {
  connectionString: string
  database: string
}

export interface CosmosConnector {
  createItem<T extends CosmosRecord>(containerName: string, item: T): Promise<T>
  getItem<T extends CosmosRecord>(containerName: string, id: string, partitionKey: string): Promise<T>
  queryItems<T>(containerName: string, query: string, parameters?: Array<{ name: string; value: any }>, options?: QueryOptions): Promise<T[]>
  queryItemsWithPagination<T>(containerName: string, query: string, parameters?: Array<{ name: string; value: any }>, options?: QueryOptions): Promise<QueryResult<T>>
  replaceItem<T extends CosmosRecord>(containerName: string, id: string, partitionKey: string, item: T): Promise<T>
  deleteItem(containerName: string, id: string, partitionKey: string): Promise<void>
  createContainerIfNotExists(containerName: string): Promise<Container>
}

export function createCosmosConnector(config: CosmosConfig): CosmosConnector {
  let cosmosClient: CosmosClient | null = null
  let databaseName: string | null = null

  async function getCosmosClientAndDb(): Promise<{ client: CosmosClient; databaseName: string }> {
    if (cosmosClient && databaseName) return { client: cosmosClient, databaseName }
    
    if (!config.connectionString || !config.database) {
      throw new Error('Cosmos DB config missing: connectionString and database are required.')
    }
    cosmosClient = new CosmosClient(config.connectionString)
    databaseName = config.database
    return { client: cosmosClient, databaseName }
  }

  async function getContainer(containerName: string): Promise<Container> {
    const { client, databaseName } = await getCosmosClientAndDb()
    await createContainerIfNotExists(containerName)

    return client.database(databaseName).container(containerName)
  }

  async function createItem<T extends CosmosRecord>(containerName: string, item: T): Promise<T> {
    const container = await getContainer(containerName)
    const { resource } = await container.items.create(item)
    return resource as T
  }

  async function getItem<T extends CosmosRecord>(
    containerName: string,
    id: string,
    partitionKey: string
  ): Promise<T> {
    const container = await getContainer(containerName)
    const { resource } = await container.item(id, partitionKey).read()
    return resource as T
  }

  async function queryItems<T>(
    containerName: string,
    query: string,
    parameters: Array<{ name: string; value: any }> = [],
    options: QueryOptions = {}
  ): Promise<T[]> {
    const container = await getContainer(containerName)

    const queryOptions = {
      query,
      parameters: parameters,
      // If maxItemCount is 0, don't include it (unlimited)
      ...(options.maxItemCount !== 0 && { maxItemCount: options.maxItemCount }),
      continuationToken: options.continuationToken,
    }

    const response = await container.items.query(queryOptions).fetchAll()
    return response.resources as T[]
  }

  async function queryItemsWithPagination<T>(
    containerName: string,
    query: string,
    parameters: Array<{ name: string; value: any }> = [],
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const container = await getContainer(containerName)

    const queryOptions = {
      query,
      parameters: parameters,
      // If maxItemCount is 0, don't include it (unlimited)
      ...(options.maxItemCount !== 0 && { maxItemCount: options.maxItemCount }),
      continuationToken: options.continuationToken,
    }

    const response = await container.items.query(queryOptions).fetchAll()
    return {
      items: response.resources as T[],
      continuationToken: response.continuationToken,
    }
  }

  async function replaceItem<T extends CosmosRecord>(
    containerName: string,
    id: string,
    partitionKey: string,
    item: T
  ): Promise<T> {
    const container = await getContainer(containerName)
    const { resource } = await container.item(id, partitionKey).replace(item)
    return resource as T
  }

  async function deleteItem(containerName: string, id: string, partitionKey: string): Promise<void> {
    const container = await getContainer(containerName)
    await container.item(id, partitionKey).delete()
  }

  async function createContainerIfNotExists(containerName: string): Promise<Container> {
    const { client, databaseName } = await getCosmosClientAndDb()
    const database = client.database(databaseName)

    const { container } = await database.containers.createIfNotExists({
      id: containerName,
      partitionKey: {
        paths: ['/id'],
      },
    })

    return container
  }

  return {
    createItem,
    getItem,
    queryItems,
    queryItemsWithPagination,
    replaceItem,
    deleteItem,
    createContainerIfNotExists,
  }
}

// Legacy export for backward compatibility - should be removed eventually
export const cosmosConnector = createCosmosConnector({
  connectionString: process.env.COSMOS_DB_ENDPOINT || '',
  database: process.env.COSMOS_DB_NAME || ''
})

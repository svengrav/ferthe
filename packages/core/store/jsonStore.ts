// JSON file store implementation for local development and testing
import { createCuid2 } from '@core/utils/idGenerator.ts'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { StoreInterface } from './storeInterface.ts'

interface JsonStoreOptions {
  baseDirectory?: string
}

interface UniqueItem {
  id: string
}

export function createJsonStore(options: JsonStoreOptions = {}): StoreInterface {
  const baseDir = options.baseDirectory || './data'

  const ensureDirectoryExists = async (): Promise<void> => {
    try {
      await fs.mkdir(baseDir, { recursive: true })
    } catch (_error) {
      // Directory might already exist, ignore error
    }
  }
  const readData = async <T extends UniqueItem>(container: string): Promise<T[]> => {
    try {
      await ensureDirectoryExists()
      const filePath = path.join(baseDir, `${container}.json`)
      const content = await fs.readFile(filePath, 'utf-8')
      const parsed = JSON.parse(content)

      return parsed || []
    } catch (_error) {
      // File doesn't exist or is empty, return empty array
      return []
    }
  }

  const writeData = async <T extends UniqueItem>(container: string, data: T[]): Promise<void> => {
    await ensureDirectoryExists()
    const filePath = path.join(baseDir, `${container}.json`)

    // Ensure data is always an array before writing
    const arrayData = Array.isArray(data) ? data : [data]
    await fs.writeFile(filePath, JSON.stringify(arrayData, null, 2), 'utf-8')
  }

  return {
    async create<T extends UniqueItem>(container: string, item: T): Promise<T> {
      try {
        const data = await readData(container)
        if (!item.id) {
          item = { ...item, id: createCuid2() }
        }

        // Check for duplicate ID
        if (data.find(existingItem => existingItem.id === item.id)) {
          throw new Error(`Item with id ${item.id} already exists`)
        }

        data.push(item)

        await writeData(container, data)
        return { ...item }
      } catch (error) {
        throw new Error(`Failed to create item: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    },

    async get<T extends UniqueItem>(container: string, id: string): Promise<T | undefined> {
      try {
        const data = await readData(container)
        return data.find(item => item.id === id) as T | undefined
      } catch (error) {
        throw new Error(`Failed to get item: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    },

    async list<T extends UniqueItem>(container: string): Promise<T[]> {
      try {
        return await readData(container)
      } catch (error) {
        throw new Error(`Failed to list items: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    },

    async update<T extends UniqueItem>(container: string, id: string, updates: Partial<T>): Promise<T | undefined> {
      try {
        const data = await readData(container)
        const index = data.findIndex(item => item.id === id)

        if (index === -1) {
          return undefined
        }

        const updatedItem = { ...data[index], ...updates } as T
        data[index] = updatedItem
        await writeData(container, data)
        return { ...updatedItem }
      } catch (error) {
        throw new Error(`Failed to update item: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    },

    async delete(container: string, id: string): Promise<void> {
      try {
        const data = await readData(container)
        const filteredData = data.filter(item => item.id !== id)

        if (filteredData.length === data.length) {
          throw new Error(`Item with id ${id} not found`)
        }

        await writeData(container, filteredData)
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          throw error
        }
        throw new Error(`Failed to delete item: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    },

    async deleteAll(container: string): Promise<void> {
      try {
        await writeData(container, [])
      } catch (error) {
        throw new Error(`Failed to delete all items: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    },
  }
}

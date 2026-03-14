/**
 * PostgreSQL Store Implementation
 * Uses Supabase client for database access
 */

import { createClient } from '@supabase/supabase-js'
import { QueryOptions } from '@shared/contracts/index.ts'
import { logger } from '@core/shared/logger.ts'
import { ListResult, StoreInterface, StoreItem } from './storeInterface.ts'

interface PostgresStoreOptions {
  supabaseUrl: string
  supabaseKey: string
}

export function createPostgresStore(options: PostgresStoreOptions): StoreInterface {
  const { supabaseUrl, supabaseKey } = options

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Postgres store requires supabaseUrl and supabaseKey')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  return {
    async create<T extends StoreItem>(container: string, item: T): Promise<T> {
      const { data, error } = await supabase
        .from(container)
        .insert(transformToDb(item))
        .select()
        .single()

      if (error) {
        logger.error('PostgreSQL create failed', { container, error: error.message, code: error.code })
        throw new Error(`Create failed: ${error.message}`)
      }
      return transformFromDb(data) as T
    },

    async get<T extends StoreItem>(container: string, id: string): Promise<T | undefined> {
      const { data, error } = await supabase
        .from(container)
        .select()
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return undefined // Not found
        logger.error('PostgreSQL get failed', { container, id, error: error.message, code: error.code })
        throw new Error(`Get failed: ${error.message}`)
      }

      return transformFromDb(data) as T
    },

    async list<T extends StoreItem>(container: string, options?: QueryOptions): Promise<ListResult<T>> {
      let query = supabase.from(container).select('*', { count: 'exact' })

      // Apply filters
      if (options?.filters) {
        for (const [key, value] of Object.entries(options.filters)) {
          if (value === undefined || value === null) continue // Skip null/undefined filters
          if (Array.isArray(value)) {
            query = query.in(toSnakeCase(key), value)
          } else {
            query = query.eq(toSnakeCase(key), value)
          }
        }
      }

      // Apply sorting
      if (options?.sortBy) {
        const ascending = options.sortOrder !== 'desc'
        query = query.order(toSnakeCase(options.sortBy), { ascending })
      }

      // Apply pagination
      if (options?.limit !== undefined) {
        query = query.limit(options.limit)
      }

      const { data, error, count } = await query

      if (error) {
        logger.error('PostgreSQL list failed', { container, error: error.message, code: error.code })
        throw new Error(`List failed: ${error.message}`)
      }

      const rows = (data || []).map(transformFromDb) as T[]
      const total = count ?? 0
      const limit = options?.limit
      const cursor = options?.cursor
      let nextCursor: string | undefined
      if (cursor && limit !== undefined) {
        const idx = rows.findIndex(item => item.id === cursor)
        const start = idx >= 0 ? idx + 1 : 0
        const paged = rows.slice(start, start + limit)
        const lastItem = paged[paged.length - 1]
        nextCursor = start + limit < total && lastItem ? lastItem.id : undefined
        return { data: paged, total, nextCursor }
      }
      if (limit !== undefined && rows.length >= limit) {
        nextCursor = rows[rows.length - 1]?.id
      }
      return { data: rows, total, nextCursor }
    },

    async update<T extends StoreItem>(container: string, id: string, item: Partial<T>): Promise<T | undefined> {
      const { data, error } = await supabase
        .from(container)
        .update(transformToDb(item))
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') return undefined
        logger.error('PostgreSQL update failed', { container, id, error: error.message, code: error.code })
        throw new Error(`Update failed: ${error.message}`)
      }

      return transformFromDb(data) as T
    },

    async delete(container: string, id: string): Promise<void> {
      const { error } = await supabase
        .from(container)
        .delete()
        .eq('id', id)

      if (error) {
        logger.error('PostgreSQL delete failed', { container, id, error: error.message, code: error.code })
        throw new Error(`Delete failed: ${error.message}`)
      }
    },

    async deleteAll(container: string): Promise<void> {
      const { error } = await supabase
        .from(container)
        .delete()
        .neq('id', '') // Delete all (workaround)

      if (error) {
        logger.error('PostgreSQL deleteAll failed', { container, error: error.message, code: error.code })
        throw new Error(`DeleteAll failed: ${error.message}`)
      }
    },
  }
}

// Transform camelCase to snake_case for DB
function toSnakeCase(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase()
}

// Transform snake_case to camelCase from DB
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

// Transform object keys to snake_case for DB
function transformToDb(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj
  if (obj instanceof Date) return obj.toISOString()
  if (Array.isArray(obj)) return obj.map(transformToDb)

  const result: any = {}

  // Convert location object to PostGIS POINT format
  if (obj.location && typeof obj.location === 'object' && obj.location.lat !== undefined && obj.location.lon !== undefined) {
    result.location = `POINT(${obj.location.lon} ${obj.location.lat})`
  }

  for (const [key, value] of Object.entries(obj)) {
    if (key === 'location') continue

    const dbKey = toSnakeCase(key)

    // nested objects/arrays are JSONB — preserve as-is, only transform scalar keys
    result[dbKey] = value !== null && typeof value === 'object' ? value : transformToDb(value)
  }
  return result
}

// Transform object keys to camelCase from DB
function transformFromDb(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(transformFromDb)

  const result: any = {}

  for (const [key, value] of Object.entries(obj)) {
    if (key === 'location') continue

    // nested objects/arrays from DB are JSONB — preserve as-is, only transform scalar keys
    result[toCamelCase(key)] = value !== null && typeof value === 'object' ? value : transformFromDb(value)
  }

  // Convert PostGIS POINT to location object
  if (obj.location) {
    if (typeof obj.location === 'string' && obj.location.startsWith('POINT')) {
      // WKT: "POINT(lon lat)"
      const match = obj.location.match(/POINT\(([^ ]+) ([^ ]+)\)/)
      if (match) {
        result.location = { lon: parseFloat(match[1]), lat: parseFloat(match[2]) }
      }
    } else if (typeof obj.location === 'string' && /^[0-9a-fA-F]+$/.test(obj.location)) {
      // EWKB hex (Supabase REST API returns PostGIS geography as hex-encoded WKB)
      // Format: 1B order + 4B type + [4B SRID] + 8B lon + 8B lat
      const bytes = new Uint8Array(obj.location.length / 2)
      for (let i = 0; i < obj.location.length; i += 2) {
        bytes[i / 2] = parseInt(obj.location.slice(i, i + 2), 16)
      }
      const view = new DataView(bytes.buffer)
      const le = view.getUint8(0) === 1
      const geomType = view.getUint32(1, le)
      const hasSrid = (geomType & 0x20000000) !== 0
      const coordOffset = hasSrid ? 9 : 5
      const lon = view.getFloat64(coordOffset, le)
      const lat = view.getFloat64(coordOffset + 8, le)
      result.location = { lon, lat }
    } else if (typeof obj.location === 'object' && obj.location.coordinates) {
      // GeoJSON format
      result.location = { lon: obj.location.coordinates[0], lat: obj.location.coordinates[1] }
    }
  }

  return result
}

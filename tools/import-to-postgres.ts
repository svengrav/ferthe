/**
 * Import JSON data to PostgreSQL
 * Reads exported JSON files and inserts into Supabase
 */

import { Client } from 'postgres'
import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const EXPORT_DIR = resolve(import.meta.dirname, '../_data/export')
const DATABASE_URL = Deno.env.get('POSTGRES_URL') || 'postgresql://postgres:postgres@localhost:54322/postgres'

// Table name mapping (JSON file → PostgreSQL table)
const TABLE_MAP: Record<string, string> = {
  'trail-collection': 'trails',
  'spot-collection': 'spots',
  'trail-spot-relations': 'trail_spots',
  'account-collection': 'accounts',
  'account-sessions': 'account_sessions',
  'account-sms-codes': 'account_sms_codes',
  'discovery-collection': 'discoveries',
  'discovery-profile-collection': 'discovery_profiles',
  'discovery-content-collection': 'discovery_contents',
  'story-collection': 'stories',
  'spot-ratings': 'spot_ratings',
  'trail-ratings': 'trail_ratings',
  'sensor-scans': 'sensor_scans',
  'community-collection': 'communities',
  'community-members': 'community_members',
  'community-discoveries': 'community_discoveries',
  'device-tokens': 'device_tokens',
  'stumble-pois': 'stumble_pois',
  'stumble-visits': 'stumble_visits',
}

async function importCollection(client: Client, filename: string) {
  const collectionName = filename.replace('.json', '')
  const tableName = TABLE_MAP[collectionName]

  if (!tableName) {
    console.log(`⊘ Skipping ${filename} (no table mapping)`)
    return
  }

  console.log(`Importing ${filename} → ${tableName}...`)

  const filepath = resolve(EXPORT_DIR, filename)
  const content = await readFile(filepath, 'utf-8')
  const records = JSON.parse(content)

  if (records.length === 0) {
    console.log(`  ⊘ Empty collection, skipping`)
    return
  }

  // Transform records (camelCase → snake_case, geo fields, etc.)
  const transformedRecords = records.map(transformRecord)

  // Bulk insert
  let inserted = 0
  for (const record of transformedRecords) {
    try {
      const columns = Object.keys(record)
      const values = Object.values(record)
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ')

      const sql = `
        INSERT INTO ${tableName} (${columns.join(', ')})
        VALUES (${placeholders})
        ON CONFLICT (id) DO NOTHING
      `

      await client.query(sql, values)
      inserted++
    } catch (err) {
      console.error(`  ✗ Failed to insert record:`, err.message)
    }
  }

  console.log(`  ✓ Inserted ${inserted}/${records.length} records`)
}

function transformRecord(record: any): any {
  const transformed: any = {}

  for (const [key, value] of Object.entries(record)) {
    // Convert camelCase to snake_case
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()

    // Transform geo location to PostGIS format
    if (key === 'location' && value && typeof value === 'object') {
      const { latitude, longitude } = value as any
      transformed[snakeKey] = `POINT(${longitude} ${latitude})`
      continue
    }

    // Transform dates
    if (value instanceof Date || (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/))) {
      transformed[snakeKey] = new Date(value)
      continue
    }

    // Transform arrays/objects to JSON
    if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
      transformed[snakeKey] = JSON.stringify(value)
      continue
    }

    transformed[snakeKey] = value
  }

  return transformed
}

async function main() {
  console.log('📥 Importing data to PostgreSQL...\n')
  console.log('Database:', DATABASE_URL.replace(/:[^:@]+@/, ':****@'), '\n')

  const client = new Client(DATABASE_URL)
  await client.connect()

  try {
    // Get all JSON files
    const files = await readdir(EXPORT_DIR)
    const jsonFiles = files.filter(f => f.endsWith('.json'))

    // Import in dependency order (accounts first, then trails, spots, etc.)
    const importOrder = [
      'account-collection.json',
      'trail-collection.json',
      'spot-collection.json',
      'trail-spot-relations.json',
      'discovery-profile-collection.json',
      'discovery-collection.json',
      // ... rest
    ]

    for (const file of importOrder) {
      if (jsonFiles.includes(file)) {
        await importCollection(client, file)
      }
    }

    // Import remaining files
    for (const file of jsonFiles) {
      if (!importOrder.includes(file)) {
        await importCollection(client, file)
      }
    }

    console.log('\n✅ Import complete!')

  } finally {
    await client.end()
  }
}

main().catch(console.error)

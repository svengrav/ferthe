/**
 * Export data from Azure Table Storage / JSON Store to JSON files
 * Prepares data for migration to PostgreSQL
 */

import { createConfig } from '@core/config/index.ts'
import { createStore, createStoreConnector } from '@core/store/storeFactory.ts'
import { STORE_IDS } from '@core/config/constants.ts'
import { writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const EXPORT_DIR = resolve(import.meta.dirname, '../../_data/export')

async function exportCollection(storeName: string, containerName: string) {
  console.log(`Exporting ${containerName}...`)

  const config = await createConfig()
  const connector = createStoreConnector(config.constants.store.type as any, {
    connectionString: config.secrets.azure.tableConnectionString,
  } as any)

  const store = createStore(connector, containerName)
  const result = await store.list()

  if (!result.success || !result.data) {
    console.error(`Failed to export ${containerName}:`, result.error)
    return
  }

  const data = result.data
  const filename = `${containerName}.json`
  const filepath = resolve(EXPORT_DIR, filename)

  await writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8')
  console.log(`✓ Exported ${data.length} records to ${filename}`)
}

async function main() {
  console.log('📦 Exporting data from Azure Table Storage...\n')

  // Create export directory
  await mkdir(EXPORT_DIR, { recursive: true })

  // Export all collections
  const collections = Object.values(STORE_IDS)

  for (const collection of collections) {
    await exportCollection('export', collection)
  }

  console.log('\n✅ Export complete! Files saved to:', EXPORT_DIR)
  console.log('Next: Run import-to-postgres.ts to load into PostgreSQL')
}

main().catch(console.error)

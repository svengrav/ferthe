import { CosmosClient } from '@azure/cosmos'
import * as fs from 'fs/promises'
import * as path from 'path'

// Mapping from JSON file names to container names
const FILE_TO_CONTAINER_MAPPING = {
  'account-collection.json': 'account-collection',
  'account-sms-codes.json': 'account-sms-codes',
  'discovery-collection.json': 'discovery-collection',
  'discovery-profile-collection.json': 'discovery-profile-collection',
  'sensor-scans.json': 'sensor-scans',
  'spot-collection.json': 'spot-collection',
  'trail-collection.json': 'trail-collection'
}

const main = async (primaryKey: string, databaseName: string) => {
  console.log('🔑 Using provided connection string...')
  
  // Connect to Cosmos DB using provided primary key
  const client = new CosmosClient(primaryKey)
  
  console.log(`📦 Creating database: ${databaseName}`)
  
  // Create database
  const { database } = await client.databases.createIfNotExists({ id: databaseName })
  
  console.log('📂 Reading JSON files from _data/core...')
  
  const dataPath = path.join(__dirname, '..', '_data', 'core')
  
  try {
    const files = await fs.readdir(dataPath)
    const jsonFiles = files.filter(file => file.endsWith('.json'))
    
    console.log(`Found ${jsonFiles.length} JSON files: ${jsonFiles.join(', ')}`)
    
    for (const fileName of jsonFiles) {
      const containerName = FILE_TO_CONTAINER_MAPPING[fileName as keyof typeof FILE_TO_CONTAINER_MAPPING]
      
      if (!containerName) {
        console.log(`⚠️  Skipping ${fileName} - no container mapping found`)
        continue
      }
      
      console.log(`\n📝 Processing ${fileName} -> ${containerName}`)
      
      // Create container if it doesn't exist
      const { container } = await database.containers.createIfNotExists({
        id: containerName,
        partitionKey: '/id'
      })
      
      // Read JSON file
      const filePath = path.join(dataPath, fileName)
      const fileContent = await fs.readFile(filePath, 'utf8')
      const data = JSON.parse(fileContent)
      
      // Ensure data is an array
      const items = Array.isArray(data) ? data : [data]
      
      console.log(`   Found ${items.length} items to import`)
      
      // Upload data
      let successCount = 0
      let errorCount = 0
      
      for (const item of items) {
        try {
          if (!item.id) {
            console.log(`   ⚠️  Skipping item without id: ${JSON.stringify(item).substring(0, 100)}...`)
            continue
          }
          
          await container.items.upsert(item)
          successCount++
          
          if (successCount % 10 === 0) {
            console.log(`   📥 Imported ${successCount}/${items.length} items...`)
          }
        } catch (error) {
          errorCount++
          console.log(`   ❌ Error importing item ${item.id}: ${error instanceof Error ? error.message : error}`)
        }
      }
      
      console.log(`   ✅ Container ${containerName}: ${successCount} items imported, ${errorCount} errors`)
    }
    
    console.log('\n🎉 Data import completed!')
    
  } catch (error) {
    console.error('❌ Error reading data directory:', error)
    throw error
  }
}

// Get command line arguments
const args = process.argv.slice(2)

if (args.length !== 2) {
  console.error('Usage: tsx setupCosmos.ts <primaryKey> <databaseName>')
  console.error('Example: tsx setupCosmos.ts "AccountEndpoint=https://..." "ferthe-core-dev-v1"')
  process.exit(1)
}

const [primaryKey, databaseName] = args

main(primaryKey, databaseName).catch(console.error)

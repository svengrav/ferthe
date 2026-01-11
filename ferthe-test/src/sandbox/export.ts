import { promises as fs } from 'fs'
import * as path from 'path'
import { join } from 'path'
import { getSandboxData } from './data'

/**
 * Exports all databox data to JSON files in the specified directory for test database initialization
 * @param outputPath - Custom output directory path (optional, defaults to _data in project root)
 */
export async function sandboxDataboxToLocalDatabase(outputPath?: string): Promise<void> {
  try {
    // Get data from both databoxes
    const sandboxData = getSandboxData()

    // Define output directory (custom path or default to _data in project root)
    // exports to {{workspaceRoot}}/_data/core by default
    const outputDir = outputPath || path.join(process.cwd(), '../', './_data', 'core')

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true })

    Object.keys(sandboxData).forEach(key => {
      const dataArray = Array.isArray(sandboxData[key].data) ? sandboxData[key].data : [sandboxData[key].data]

      fs.writeFile(join(outputDir, sandboxData[key].fileName), JSON.stringify(dataArray, null, 2))
    })

    console.log('✅ Successfully exported databox data to _data directory:')
    Object.keys(sandboxData).forEach(key => {
      const dataArray = Array.isArray(sandboxData[key].data) ? sandboxData[key].data : [sandboxData[key].data]
      console.log(`   - ${sandboxData[key].fileName}: ${dataArray.length} items`)
    })
  } catch (error) {
    console.error('❌ Error exporting databox data:', error)
    throw error
  }
}

/**
 * Test script to export databox data to _data directory
 * Usage: npx tsx src/sandbox/testExport.ts
 */
async function main() {
  console.log('🚀 Starting databox export test...')

  try {
    // Test full export
    console.log('\n📦 Testing full export...')
    await sandboxDataboxToLocalDatabase()

    console.log('\n✅ All export tests completed successfully!')
  } catch (error) {
    console.error('\n❌ Export test failed:', error)
    process.exit(1)
  }
}

// Run if this script is executed directly
if (require.main === module) {
  main()
}

export { main as exportSandboxData }

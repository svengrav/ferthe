import { join } from 'jsr:@std/path'
import { getSandboxData } from './data.ts'

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
    let outputDir = outputPath
    if (!outputDir) {
      // Get the workspace root from the script location
      // Script is at packages/test/src/sandbox/export.ts
      // Workspace root is ../../../..
      const scriptUrl = new URL(import.meta.url)
      const scriptPath = scriptUrl.pathname
      const workspaceRoot = scriptPath.split('/packages/')[0]
      outputDir = join(workspaceRoot, '_data', 'core')
    }

    // Ensure output directory exists
    await Deno.mkdir(outputDir, { recursive: true })

    // Write all files and wait for completion
    const writePromises = Object.keys(sandboxData).map(key => {
      const dataArray = Array.isArray(sandboxData[key].data) ? sandboxData[key].data : [sandboxData[key].data]
      const filePath = join(outputDir, sandboxData[key].fileName)
      return Deno.writeTextFile(filePath, JSON.stringify(dataArray, null, 2))
    })

    await Promise.all(writePromises)

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
 * Usage: deno run --allow-all src/sandbox/export.ts
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
    Deno.exit(1)
  }
}

// Run if this script is executed directly
if (import.meta.main) {
  main()
}

export { main as exportSandboxData }

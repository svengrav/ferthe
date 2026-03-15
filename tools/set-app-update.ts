/**
 * App Update Tool
 * ---
 * Write a new app update entry to the database via systemApplication.
 *
 * Usage:
 *   deno run --allow-all tools/set-app-update.ts --version <version> --latest <version> --min <version> [options]
 *
 * Required:
 *   --version <str>    Version string for this update entry (e.g. "0.6.0")
 *   --latest <str>     Latest available app version
 *   --min <str>        Minimum required app version
 *
 * Options:
 *   --force            Block app until updated (default: false)
 *   --message <str>    Optional update message shown to users
 *   --notes <str>      Comma-separated patch notes (e.g. "Fix bug,New feature")
 *   --store-url <str>  App store URL (default: Play Store URL)
 *
 * Examples:
 *   deno run --allow-all tools/set-app-update.ts --version 0.6.0 --latest 0.6.0 --min 0.5.0
 *   deno run --allow-all tools/set-app-update.ts --version 0.6.0 --latest 0.6.0 --min 0.6.0 --force --message "Critical update" --notes "Security fix,Performance improvements"
 */

import { createConfig, createStoreConfig } from '../packages/core/config/index.ts'
import { createSystemApplication } from '../packages/core/features/system/systemApplication.ts'
import { createStore, createStoreConnector } from '../packages/core/store/storeFactory.ts'
import { AppUpdate, AppUpdateInput } from '../packages/shared/contracts/system.ts'
import { STORE_IDS } from '../packages/core/config/constants.ts'
import * as dotenv from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '..', 'packages', 'core', '.env') })
dotenv.config({ path: resolve(__dirname, '..', '.env') })

// --- Arg parsing ---

const getArg = (flag: string, fallback?: string): string | undefined => {
  const index = Deno.args.indexOf(flag)
  if (index !== -1 && Deno.args[index + 1]) return Deno.args[index + 1]
  return fallback
}

const hasFlag = (flag: string): boolean => Deno.args.includes(flag)

const parseArgs = (): AppUpdateInput & { version: string } => {
  const version = getArg('--version')
  const latestAppVersion = getArg('--latest')
  const minAppVersion = getArg('--min')

  if (!version || !latestAppVersion || !minAppVersion) {
    console.error('❌ --version, --latest and --min are required')
    console.log('Usage: deno run --allow-all tools/set-app-update.ts --version <v> --latest <v> --min <v>')
    Deno.exit(1)
  }

  const notesRaw = getArg('--notes', '')
  const patchNotes = notesRaw ? notesRaw.split(',').map(n => n.trim()).filter(Boolean) : []

  return {
    version,
    latestAppVersion,
    minAppVersion,
    force: hasFlag('--force'),
    message: getArg('--message'),
    patchNotes,
    storeUrl: getArg('--store-url', 'https://play.google.com/store/apps/details?id=de.ferthe.app'),
  }
}

// --- Main ---

const run = async () => {
  console.log('📦 App Update Tool')
  console.log('---')

  const input = parseArgs()

  console.log(`📋 Update entry:`)
  console.log(`   version:      ${input.version}`)
  console.log(`   latestApp:    ${input.latestAppVersion}`)
  console.log(`   minApp:       ${input.minAppVersion}`)
  console.log(`   force:        ${input.force}`)
  if (input.message) console.log(`   message:      ${input.message}`)
  if (input.patchNotes?.length) console.log(`   patchNotes:   ${input.patchNotes.join(', ')}`)
  console.log('')

  console.log('⚙️  Loading configuration...')
  const config = await createConfig()

  console.log('💾 Connecting to store...')
  const storeConfig = createStoreConfig(config)
  const storeConnector = createStoreConnector(config.constants.store.type, storeConfig)
  const appUpdatesStore = createStore<AppUpdate>(storeConnector, STORE_IDS.system_app_updates)

  const systemApplication = createSystemApplication(appUpdatesStore)

  // Admin context — tool runs server-side with full trust
  const adminContext = { accountId: 'tool', accountType: 'sms_verified' as const, role: 'admin' as const }

  console.log('✏️  Writing app update...')
  const result = await systemApplication.addAppUpdate(adminContext, input)

  if (!result.success) {
    console.error(`❌ Failed: ${result.error?.message ?? 'Unknown error'}`)
    Deno.exit(1)
  }

  console.log('✅ App update written successfully')
}

run()

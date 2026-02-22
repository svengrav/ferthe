/**
 * Push Notification Test Tool
 * ---
 * Send a test push notification to a user's registered devices
 * 
 * Environment Variables:
 *   FIREBASE_SERVICE_ACCOUNT  Firebase service account JSON (required for push)
 *                             Set via environment or .env file
 * 
 * Usage:
 *   deno run --allow-all tools/send-push-notification.ts <account-id> [options]
 * 
 * Options:
 *   --title <text>     Notification title (default: "Test Notification")
 *   --body <text>      Notification body (default: "This is a test push notification")
 *   --data <json>      Optional data payload as JSON string (default: {})
 * 
 * Examples:
 *   deno run --allow-all tools/send-push-notification.ts acc_abc123
 *   deno run --allow-all tools/send-push-notification.ts acc_abc123 --title "New Trail!" --body "Check out the new trail"
 *   deno run --allow-all tools/send-push-notification.ts acc_abc123 --data '{"type":"trail","trailId":"trail_xyz"}'
 * 
 * Note: Requires Firebase service account to be configured in .env
 */

import { createConfig } from '@core/config/index.ts'
import { createFirebaseConnector } from '@core/connectors/firebaseConnector.ts'
import { createNotificationService } from '@core/features/notification/notificationService.ts'
import { createStore } from '@core/store/storeFactory.ts'
import { createStoreConnector } from '@core/store/storeFactory.ts'
import { DeviceToken } from '@shared/contracts/index.ts'
import * as dotenv from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Load .env from project root (parent directory of tools/)
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env')
dotenv.config({ path: envPath })

interface PushOptions {
  accountId: string
  title: string
  body: string
  data?: Record<string, string>
}

const parseArgs = (): PushOptions => {
  const args = Deno.args

  if (args.length === 0) {
    console.error('❌ Error: Account ID is required')
    console.log('Usage: deno run --allow-all tools/send-push-notification.ts <account-id> [options]')
    Deno.exit(1)
  }

  const accountId = args[0]
  const title = getArg('--title', 'Test Notification')
  const body = getArg('--body', 'This is a test push notification')
  const dataStr = getArg('--data', '')

  let data: Record<string, string> | undefined
  if (dataStr) {
    try {
      data = JSON.parse(dataStr)
    } catch (error) {
      console.error('❌ Error: Invalid JSON in --data argument')
      Deno.exit(1)
    }
  }

  return { accountId, title, body, data }
}

const getArg = (flag: string, defaultValue: string): string => {
  const index = Deno.args.indexOf(flag)
  return index !== -1 && Deno.args[index + 1] ? Deno.args[index + 1] : defaultValue
}

const sendPushNotification = async (options: PushOptions) => {
  console.log('🔔 Push Notification Test Tool')
  console.log('---')

  // Load configuration (secrets + constants)
  console.log('⚙️  Loading configuration...')
  const config = await createConfig()

  // Check for Firebase service account
  if (!config.secrets.firebaseServiceAccount) {
    console.error('❌ Error: Firebase service account is not configured')
    console.log('')
    console.log('Set FIREBASE_SERVICE_ACCOUNT in .env file as JSON string:')
    console.log('  FIREBASE_SERVICE_ACCOUNT=\'{"type":"service_account","project_id":"..."}\'')
    console.log('')
    console.log('Or download the service account JSON from Firebase Console:')
    console.log('  Project Settings → Service Accounts → Generate new private key')
    console.log('')
    Deno.exit(1)
  }

  console.log('✅ Firebase service account loaded')

  // Create store connector
  console.log('💾 Connecting to data store...')
  const storeConnector = createStoreConnector(config.constants.store.type, {
    connectionString: config.secrets.cosmosConnectionString,
    database: config.constants.store.cosmosDatabase,
    baseDirectory: config.constants.store.jsonBaseDirectory,
  })

  const deviceTokenStore = createStore<DeviceToken>(storeConnector, 'device-tokens')

  // Find device tokens for the account
  console.log(`🔍 Searching for device tokens for account: ${options.accountId}`)
  const tokensResult = await deviceTokenStore.list()

  if (!tokensResult.success || !tokensResult.data) {
    console.error('❌ Failed to retrieve device tokens')
    Deno.exit(1)
  }

  const userTokens = tokensResult.data.filter(t => t.accountId === options.accountId)

  if (userTokens.length === 0) {
    console.log('⚠️  No device tokens found for this account')
    console.log('')
    console.log('Make sure the user has:')
    console.log('  1. Logged into the app')
    console.log('  2. Granted notification permissions')
    console.log('  3. Device token was successfully registered')
    console.log('')
    Deno.exit(0)
  }

  console.log(`✅ Found ${userTokens.length} device token(s)`)
  userTokens.forEach((token, i) => {
    console.log(`   ${i + 1}. Platform: ${token.platform}, Last updated: ${new Date(token.updatedAt).toISOString()}`)
  })
  console.log('')

  // Create Firebase connector and notification service
  const firebaseConnector = createFirebaseConnector(config.secrets.firebaseServiceAccount)
  const notificationService = createNotificationService({
    deviceTokenStore,
    firebaseConnector,
  })

  // Send push notification
  console.log('📤 Sending push notification...')
  console.log(`   Title: "${options.title}"`)
  console.log(`   Body:  "${options.body}"`)
  if (options.data) {
    console.log(`   Data:  ${JSON.stringify(options.data)}`)
  }
  console.log('')

  try {
    await notificationService.sendToUser(options.accountId, {
      title: options.title,
      body: options.body,
      data: options.data,
    })

    console.log('---')
    console.log('✅ Push notification sent successfully!')
    console.log('')
    console.log(`📱 Sent to ${userTokens.length} device(s)`)
    console.log('')
    console.log('💡 Check your device for the notification')
    console.log('')
  } catch (error: any) {
    console.error('❌ Error sending push notification:', error.message)
    Deno.exit(1)
  }
}

// Run
try {
  const options = parseArgs()
  await sendPushNotification(options)
} catch (error: any) {
  console.error('❌ Error:', error.message)
  Deno.exit(1)
}

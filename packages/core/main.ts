import { createApiHandler } from '@core/api/tsr/router.ts'
import { createConfig } from '@core/config/index.ts'
import { createTwilioSMSConnector } from '@core/connectors/smsConnector.ts'
import { createAzureStorageConnector } from '@core/connectors/storageConnector.ts'
import { createCoreContext } from '@core/index.ts'
import { logger } from '@core/shared/logger.ts'
import { createStoreConnector } from '@core/store/storeFactory.ts'

/**
 * Main entry point for ferthe-core server
 */
const run = async () => {
  const config = await createConfig()
  const { secrets, constants } = config

  // Create runtime connector instances
  const connectors = {
    storeConnector: createStoreConnector(constants.store.type, {
      connectionString: secrets.cosmosConnectionString,
      database: constants.store.cosmosDatabase,
      baseDirectory: constants.store.jsonBaseDirectory,
    }),
    smsConnector: createTwilioSMSConnector({
      authToken: secrets.twilioAuthToken,
      accountSid: constants.twilio.accountSid,
      verifyServiceId: constants.twilio.verifyServiceId,
    }),
    storageConnector: createAzureStorageConnector(
      secrets.storageConnectionString,
      constants.storage.containerName,
      {
        sasExpiryMinutes: constants.storage.sasExpiryMinutes,
        storageVersion: 'v1',
        imageFolder: 'images',
      }
    ),
  }

  const context = createCoreContext(config, connectors)
  const handler = createApiHandler(context, constants.api.origins)

  logger.info(`Starting server on ${constants.api.host}:${constants.api.port}`)

  Deno.serve(
    { port: constants.api.port, hostname: constants.api.host },
    handler,
  )
}

run()

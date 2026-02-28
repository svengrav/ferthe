import { createOakServer } from '@core/api/oak/server.ts'
import createRoutes from '@core/api/routes.ts'
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
  const routes = createRoutes(context)

  logger.info(`Starting server on ${constants.api.host}:${constants.api.port}`)

  const server = createOakServer({
    routes,
    origins: constants.api.origins,
    host: constants.api.host,
    port: constants.api.port,
    prefix: '/core/api',
  })

  await server.start()
}

run()

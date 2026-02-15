import { createOakServer } from '@core/api/oak/server.ts'
import { createConfig } from '@core/config/index.ts'
import { createTwilioSMSConnector } from '@core/connectors/smsConnector.ts'
import { createAzureStorageConnector } from '@core/connectors/storageConnector.ts'
import { createCoreContext } from '@core/index.ts'
import { createStoreConnector } from '@core/store/storeFactory.ts'
import createRoutes from './api/routes.ts'

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
        imageFolder: 'images'
      }
    ),
  }

  const context = createCoreContext(config, connectors)

  const server = createOakServer({
    host: constants.api.host,
    port: constants.api.port,
    prefix: constants.api.prefix,
    logger: true,
    origins: constants.api.origins,
    routes: createRoutes(context),
  })

  await server.start()
}

run()

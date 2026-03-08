import { createOakServer } from '@core/api/oak/server.ts'
import createRoutes from '@core/api/routes.ts'
import { createConfig } from '@core/config/index.ts'
import { createTwilioSMSConnector } from '@core/connectors/smsConnector.ts'
import { createAzureStorageConnector } from '@core/connectors/storageConnector.ts'
import { CoreConnectors, createCoreContext } from '@core/index.ts'
import { logger } from '@core/shared/logger.ts'
import { createStoreConnector } from '@core/store/storeFactory.ts'
import { createGooglePlacesConnector } from "./connectors/googlePlacesConnector.ts";

/**
 * Main entry point for ferthe-core server
 */
const run = async () => {
  const config = await createConfig()
  const { secrets, constants } = config

  // Build store config based on type
  let storeConfig: any
  switch (constants.store.type) {
    case 'cosmos':
      storeConfig = {
        connectionString: secrets.azure.cosmosConnectionString,
        database: constants.store.cosmosDatabase,
      }
      break
    case 'table':
      storeConfig = {
        connectionString: secrets.azure.tableConnectionString,
      }
      break
    case 'json':
      storeConfig = {
        baseDirectory: constants.store.jsonBaseDirectory,
      }
      break
    default:
      storeConfig = undefined
  }

  // Create runtime connector instances
  const connectors: CoreConnectors = {
    poiConnector: createGooglePlacesConnector(config.secrets.google.mapsApiKey),
    storeConnector: createStoreConnector(constants.store.type, storeConfig),
    smsConnector: createTwilioSMSConnector({
      authToken: secrets.twilio.authToken,
      accountSid: secrets.twilio.accountSid,
      verifyServiceId: secrets.twilio.verifyServiceId,
    }),
    storageConnector: createAzureStorageConnector(
      secrets.azure.storageConnectionString,
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
    prefix: '/api',
  })

  await server.start()
}

run()

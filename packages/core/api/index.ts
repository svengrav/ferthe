import { createOakServer } from '@core/api/oak/server.ts'
import { createStoreConnector, STORE_TYPES } from '@core/store/storeFactory.ts'
import { createCoreContext } from '@core/index.ts'
import { getConfig } from './env.ts'
import createRoutes from './routes.ts'

const run = async () => {
  const config = await getConfig()

  // Parse Twilio configuration from access key (JSON format)
  let twilioConfig = undefined
  if (config.TWILIO_ACCESS_KEY) {
    try {
      twilioConfig = JSON.parse(config.TWILIO_ACCESS_KEY)
    } catch (error) {
      console.warn('Failed to parse Twilio configuration:', error)
    }
  }

  const context = createCoreContext({
    secrets: {
      jwtSecret: config.JWT_SIGN_KEY,
      phoneHashSalt: config.PHONE_HASH_SALT,
    },
    connectors: {
      storeConnector: createStoreConnector(config.STORE_TYPE as STORE_TYPES, {
        connectionString: config.COSMOS_CONNECTION_STRING,
        database: config.COSMOS_DATABASE_NAME,
        baseDirectory: config.JSON_STORE_BASE_DIRECTORY,
      }),
    },
    twilio: twilioConfig,
    environment: config.FERTHE_ENV,
  })

  const server = createOakServer({
    host: config.API_HOST,
    port: Number(config.API_PORT) || 8080,
    prefix: config.API_PREFIX,
    logger: true,
    origins: config.ORIGINS,
    routes: createRoutes(context),
  })

  await server.start()
}

run()

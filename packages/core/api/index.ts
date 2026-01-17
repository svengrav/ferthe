import { createOakServer } from '@core/api/oak/server.ts'
import { createCoreContext } from '@core/index.ts'
import { createStoreConnector, STORE_TYPES } from '@core/store/storeFactory.ts'
import { createTwilioSMSConnector } from "../connectors/smsConnector.ts"
import { getConfig } from './env.ts'
import createRoutes from './routes.ts'

const run = async () => {
  const config = await getConfig()

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
      smsConnector: createTwilioSMSConnector({
        authToken: config.TWILIO_ACCESS_KEY,
        accountSid: config.TWILIO_ACCOUNT_SID,
        verifyServiceId: config.TWILIO_VERIFY_SERVICE_ID,
      })
    },
    environment: config.ENV_TYPE,
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

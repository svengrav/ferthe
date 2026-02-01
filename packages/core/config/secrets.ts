import * as dotenv from 'dotenv'
import { createKeyVaultConnector } from '../connectors/azureKeyVaultConnector.ts'

export interface Secrets {
  jwtSecret: string
  phoneHashSalt: string
  cosmosConnectionString: string
  storageConnectionString: string
  twilioAuthToken: string
}

interface SecretSource {
  type: 'env' | 'keyvault'
  keyVaultName?: string
}

const getSecretSource = (): SecretSource => {
  const isProduction = Deno.env.get('PRODUCTION')?.toLowerCase() === 'true'
  return isProduction
    ? { type: 'keyvault', keyVaultName: 'kv-ferthe-core' }
    : { type: 'env' }
}

export async function loadSecrets(): Promise<Secrets> {
  dotenv.config()
  const source = getSecretSource()

  if (source.type === 'keyvault' && source.keyVaultName) {
    console.log('Loading secrets from Azure Key Vault...')
    const keyVault = createKeyVaultConnector(source.keyVaultName)

    const [jwt, phone, cosmos, storage, twilio] = await Promise.all([
      keyVault.getSecret('api-jwt-sign-key'),
      keyVault.getSecret('api-phone-hash-salt-key'),
      keyVault.getSecret('cstr-cdb-ferthe-core'),
      keyVault.getSecret('key-stferthecore'),
      keyVault.getSecret('key-twilio-phone-verify'),
    ])

    return {
      jwtSecret: jwt.value || '',
      phoneHashSalt: phone.value || '',
      cosmosConnectionString: cosmos.value || '',
      storageConnectionString: storage.value || '',
      twilioAuthToken: twilio.value || '',
    }
  }

  // Load from .env
  return {
    jwtSecret: Deno.env.get('JWT_SECRET') || 'dev-jwt-secret-key',
    phoneHashSalt: Deno.env.get('PHONE_HASH_SALT') || 'dev-phone-salt',
    cosmosConnectionString: Deno.env.get('COSMOS_CONNECTION_STRING') || '',
    storageConnectionString: Deno.env.get('AZURE_STORAGE_CONNECTION_STRING') || '',
    twilioAuthToken: Deno.env.get('TWILIO_AUTH_TOKEN') || '',
  }
}

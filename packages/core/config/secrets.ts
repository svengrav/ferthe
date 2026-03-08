import { createKeyVaultConnector } from '../connectors/azureKeyVaultConnector.ts'
import { KEY_VAULT_CONFIG } from './keyVaultConfig.ts'

export interface FirebaseServiceAccount {
  client_email: string
  private_key: string
  project_id: string
}

export interface Secrets {
  jwtSecret: string
  phoneHashSalt: string
  azure: {
    storageConnectionString: string
    tableConnectionString: string
    cosmosConnectionString: string
    mapsApiKey: string
  }
  google: {
    mapsApiKey: string
  }
  twilio: {
    accountSid: string
    verifyServiceId: string
    authToken: string
  }
  firebase: {
    serviceAccount: FirebaseServiceAccount | null
    apiKey: string
    appId: string
    projectId: string
    messagingSenderId: string
    storageBucket: string
    databaseURL: string
  }
}

/**
 * Load secrets from Key Vault JSON-Secret using Service Principal authentication
 */
async function loadSecretsFromKeyVault(keyVaultName: string, clientSecret: string): Promise<Secrets> {
  console.log(`Loading secrets from Key Vault (${KEY_VAULT_CONFIG.secretName})...`)

  const keyVault = createKeyVaultConnector({
    keyVaultName,
    clientId: KEY_VAULT_CONFIG.clientId,
    clientSecret,
    tenantId: KEY_VAULT_CONFIG.tenantId,
  })

  const { value } = await keyVault.getSecret(KEY_VAULT_CONFIG.secretName)

  if (!value) {
    throw new Error(`Secret "${KEY_VAULT_CONFIG.secretName}" not found in vault "${keyVaultName}"`)
  }

  const secrets = JSON.parse(value) as Secrets
  console.log('✅ Secrets loaded from Key Vault')
  return secrets
}

/**
 * Load secrets from local _config.json file for development
 */
async function loadSecretsFromLocalConfig(): Promise<Secrets> {
  console.log('Loading secrets from local _config.json...')

  try {
    const configPath = new URL('../../..', import.meta.url).pathname + '/_config.json'
    const configText = await Deno.readTextFile(configPath)
    const secrets = JSON.parse(configText) as Secrets
    console.log('✅ Secrets loaded from _config.json')
    return secrets
  } catch (error) {
    console.error('Failed to load _config.json:', error)
    throw new Error('Local config file _config.json not found. Please create it from the template or set AZURE_CLIENT_SECRET to use Key Vault.')
  }
}

export async function loadSecrets(): Promise<Secrets> {
  const clientSecret = Deno.env.get('AZURE_CLIENT_SECRET')
  const keyVaultName = Deno.env.get('AZURE_KEYVAULT_NAME') || KEY_VAULT_CONFIG.defaultVaultName

  // Load from Key Vault (production) or local _config.json (development)
  if (clientSecret) {
    return await loadSecretsFromKeyVault(keyVaultName, clientSecret)
  }

  return await loadSecretsFromLocalConfig()
}

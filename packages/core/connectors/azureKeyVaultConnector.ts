import { DefaultAzureCredential, ClientSecretCredential } from '@azure/identity'
import { SecretClient } from '@azure/keyvault-secrets'

interface KeyVaultConnectorOptions {
  keyVaultName: string
  clientId?: string
  clientSecret?: string
  tenantId?: string
}

export const createKeyVaultConnector = (keyVaultNameOrOptions: string | KeyVaultConnectorOptions) => {
  const options = typeof keyVaultNameOrOptions === 'string'
    ? { keyVaultName: keyVaultNameOrOptions }
    : keyVaultNameOrOptions

  const { keyVaultName, clientId, clientSecret, tenantId } = options

  // Use ClientSecretCredential if credentials provided, otherwise DefaultAzureCredential
  const credential = (clientId && clientSecret && tenantId)
    ? new ClientSecretCredential(tenantId, clientId, clientSecret, {
      additionallyAllowedTenants: ['*'], // Allow multi-tenant access
    })
    : new DefaultAzureCredential()

  const secretClient: SecretClient = new SecretClient(`https://${keyVaultName}.vault.azure.net`, credential)

  return {
    getSecret: async (secretName: string): Promise<{ name: string; value?: string }> => {
      const secret = await secretClient.getSecret(secretName)
      return {
        name: secretName,
        value: secret.value,
      }
    },

    setSecret: async (secretName: string, value: string): Promise<void> => {
      await secretClient.setSecret(secretName, value)
    },
  }
}

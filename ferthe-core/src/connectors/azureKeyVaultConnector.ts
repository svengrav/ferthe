import { DefaultAzureCredential } from '@azure/identity'
import { SecretClient } from '@azure/keyvault-secrets'

export const createKeyVaultConnector = (keyVaultName: string) => {
  const credential = new DefaultAzureCredential()
  const secretClient: SecretClient = new SecretClient(`https://${keyVaultName}.vault.azure.net`, credential)

  return {
    getSecret: async (secretName: string): Promise<{ name: string; value?: string }> => {
      const secret = await secretClient.getSecret(secretName)
      return {
        name: secretName,
        value: secret.value,
      }
    },
  }
}

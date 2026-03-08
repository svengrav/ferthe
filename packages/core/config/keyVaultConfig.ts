/**
 * Azure Key Vault configuration constants
 * Used by both the keyvault-config tool and the core secrets loader
 */

export const KEY_VAULT_CONFIG = {
  secretName: 'json-ferthe-core-config-v1',
  clientId: 'f3bf916d-0ebf-476e-9ccb-98808c7e1038',
  tenantId: '16b3c013-d300-468d-ac64-7eda0820b6d3',
  defaultVaultName: 'kv-ferthe-core',
} as const

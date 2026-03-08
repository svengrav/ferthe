#!/usr/bin/env -S deno run --allow-all

/**
 * KeyVault Config Tool
 *
 * Stores the entire core config as a single JSON secret in Azure Key Vault.
 *
 * Usage:
 *   push <config.json>  – write config JSON as one secret into Key Vault
 *   pull                – read config secret from Key Vault, print or save as JSON
 *   template            – print an empty config template to stdout
 *
 * Authentication:
 *   Uses Service Principal with Client ID: f3bf916d-0ebf-476e-9ccb-98808c7e1038
 *   Provide client secret via --secret flag or use DefaultAzureCredential (Azure CLI, Managed Identity)
 *
 * Examples:
 *   deno run --allow-all tools/keyvault-config.ts push config.json --secret <client-secret>
 *   deno run --allow-all tools/keyvault-config.ts pull --secret <client-secret> [--out config.json]
 *   deno run --allow-all tools/keyvault-config.ts template > config.json
 */
// deno run -A tools/keyvault-config.ts push _config.json --secret lq.8Q~jWymsUeKBHmEBvHxHxqaog-wL8hFIfEdfj


import { createKeyVaultConnector } from '../packages/core/connectors/azureKeyVaultConnector.ts'
import type { Secrets } from '../packages/core/config/index.ts'
import { KEY_VAULT_CONFIG } from '../packages/core/config/keyVaultConfig.ts'

const { secretName: SECRET_NAME, clientId: CLIENT_ID, tenantId: TENANT_ID } = KEY_VAULT_CONFIG

const TEMPLATE: Secrets = {
  jwtSecret: '',
  phoneHashSalt: '',
  azure: {
    storageConnectionString: '',
    tableConnectionString: '',
    cosmosConnectionString: '',
    mapsApiKey: '',
  },
  google: {
    mapsApiKey: '',
  },
  twilio: {
    accountSid: '',
    verifyServiceId: '',
    authToken: '',
  },
  firebase: {
    serviceAccount: {
      client_email: '',
      private_key: '',
      project_id: '',
    },
    apiKey: '',
    appId: '',
    projectId: '',
    messagingSenderId: '',
    storageBucket: '',
    databaseURL: '',
  },
}

// --- CLI arg parsing ---

function parseArgs(args: string[]) {
  const flags: Record<string, string | boolean> = {}
  const positional: string[] = []

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2)
      flags[key] = args[i + 1]?.startsWith('--') ? true : (args[++i] ?? true)
    } else {
      positional.push(args[i])
    }
  }

  return { flags, positional }
}

// --- Commands ---

async function pushConfig(filePath: string, vaultName: string, clientSecret?: string) {
  const raw = await Deno.readTextFile(filePath)

  // Validate JSON before pushing
  JSON.parse(raw) as Secrets

  const kv = clientSecret
    ? createKeyVaultConnector({ keyVaultName: vaultName, clientId: CLIENT_ID, clientSecret, tenantId: TENANT_ID })
    : createKeyVaultConnector(vaultName)

  await kv.setSecret(SECRET_NAME, raw)
  console.log(`Config from "${filePath}" stored as secret "${SECRET_NAME}" in vault "${vaultName}".`)
}

async function pullConfig(vaultName: string, clientSecret?: string, outFile?: string) {
  const kv = clientSecret
    ? createKeyVaultConnector({ keyVaultName: vaultName, clientId: CLIENT_ID, clientSecret, tenantId: TENANT_ID })
    : createKeyVaultConnector(vaultName)

  const { value } = await kv.getSecret(SECRET_NAME)

  if (!value) {
    console.error(`Secret "${SECRET_NAME}" is empty or does not exist in vault "${vaultName}".`)
    Deno.exit(1)
  }

  // Pretty-print the stored JSON
  const json = JSON.stringify(JSON.parse(value), null, 2)

  if (outFile) {
    await Deno.writeTextFile(outFile, json)
    console.log(`Config written to "${outFile}".`)
  } else {
    console.log(json)
  }
}

// --- Entry Point ---

const { flags, positional } = parseArgs(Deno.args)
const command = positional[0]
const vaultName = (flags['vault'] as string) ?? KEY_VAULT_CONFIG.defaultVaultName
const clientSecret = flags['secret'] as string | undefined

if (command === 'push') {
  const file = positional[1]
  if (!file) {
    console.error('Usage: keyvault-config.ts push <config.json> [--vault <name>] [--secret <client-secret>]')
    Deno.exit(1)
  }
  await pushConfig(file, vaultName, clientSecret)
} else if (command === 'pull') {
  const outFile = flags['out'] as string | undefined
  await pullConfig(vaultName, clientSecret, outFile)
} else if (command === 'template') {
  console.log(JSON.stringify(TEMPLATE, null, 2))
} else {
  console.error('Unknown command. Use: push <file> [--vault <name>] [--secret <client-secret>] | pull [--vault <name>] [--secret <client-secret>] [--out <file>] | template')
  Deno.exit(1)
}

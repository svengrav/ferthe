import { json } from "node:stream/consumers";
import { logger } from "../index.ts";
import { Constants, createConstants } from './constants.ts'
import { loadSecrets, Secrets } from './secrets.ts'

export interface Config {
  secrets: Secrets
  constants: Constants
}

export async function createConfig(): Promise<Config> {
  const [secrets, constants] = await Promise.all([
    loadSecrets(),
    Promise.resolve(createConstants()),
  ])

  return { secrets, constants }
}

export * from './constants.ts'
export * from './secrets.ts'
export * from './keyVaultConfig.ts'
export * from './storeConfig.ts'


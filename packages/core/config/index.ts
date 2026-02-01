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


/**
 * Ferthe Core API Manifest
 * Zentrale Definition von API-Metadaten
 */

import type { AppUpdate } from '@shared/contracts/system.ts'

export const manifest = {
  name: 'Ferthe Core API',
  version: '1.0.0',
  description: 'Ferthe Core API',
  env: 'dev',
  minAppVersion: '0.5.0',
} as const

/**
 * App update config — change minAppVersion to trigger an update prompt.
 * Set force: true to block the app until updated.
 */
export const appUpdate: AppUpdate = {
  createdAt: new Date().toISOString(),
  id: 'default',
  version: '0.5.0',
  latestAppVersion: '0.5.0',
  minAppVersion: '0.5.0',
  force: false,
  message: undefined,
  patchNotes: [],
  storeUrl: 'https://play.google.com/store/apps/details?id=de.ferthe.app',
}

export type Manifest = typeof manifest

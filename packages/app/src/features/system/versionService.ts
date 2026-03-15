import type { AppUpdate } from '@shared/contracts'

/**
 * Returns true if the current version is older than the minimum required version.
 */
export function isVersionOutdated(current: string, minimum: string): boolean {
  const parse = (v: string) => v.split('.').map(n => parseInt(n, 10))
  const cur = parse(current)
  const min = parse(minimum)
  const len = Math.max(cur.length, min.length)

  for (let i = 0; i < len; i++) {
    const c = cur[i] ?? 0
    const m = min[i] ?? 0
    if (c !== m) return c < m
  }

  return false
}

/**
 * Determines whether the update prompt should be shown.
 * Respects forced updates and previously dismissed versions.
 */
export function shouldShowUpdate(update: AppUpdate, currentVersion: string, dismissedVersion: string | null): boolean {
  if (!isVersionOutdated(currentVersion, update.minAppVersion)) return false
  if (!update.force && dismissedVersion === update.minAppVersion) return false
  return true
}

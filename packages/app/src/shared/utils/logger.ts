/**
 * Simple Singleton Logger
 * API-kompatibel mit logger.log/error/warn
 *
 * Initialisierung einmalig beim App-Start via initLogger()
 */

type LogLevel = 'log' | 'warn' | 'error' | 'group'

let _enabled = false

export const initLogger = (isEnabled: boolean): void => {
  _enabled = isEnabled
}

const write = (level: LogLevel, ...args: any[]): void => {
  if (!_enabled) return

  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}]`

  switch (level) {
    case 'group':
      console.group(prefix, ...args)
      break
    case 'error':
      console.error(prefix, ...args)
      break
    case 'warn':
      console.warn(prefix, ...args)
      break
    default:
      console.log(prefix, ...args)
  }
}

export const logger = {
  group: (...args: any[]) => write('group', ...args),
  groupEnd: () => { console.groupEnd() }, // No-op for simplicity
  log: (...args: any[]) => write('log', ...args),
  warn: (...args: any[]) => write('warn', ...args),
  error: (...args: any[]) => write('error', ...args),
}

/**
 * Simple Singleton Logger
 * API-kompatibel mit logger.log/error/warn
 */

import { ENV } from "@app/env"

type LogLevel = 'log' | 'warn' | 'error'

const write = (level: LogLevel, ...args: any[]): void => {
  if (!ENV.enableLogger) return

  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`

  switch (level) {
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
  log: (...args: any[]) => write('log', ...args),
  warn: (...args: any[]) => write('warn', ...args),
  error: (...args: any[]) => write('error', ...args),
}

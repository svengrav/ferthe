/**
 * Simple logger for Core package
 * Provides structured logging with different levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  data?: unknown
}

const formatLog = (level: LogLevel, message: string, data?: unknown): LogEntry => ({
  level,
  message,
  timestamp: new Date().toISOString(),
  data,
})

export const logger = {
  debug: (message: string, data?: unknown) => {
    const entry = formatLog('debug', message, data)
    console.debug(`[DEBUG] ${entry.timestamp} - ${message}`, data || '')
  },

  info: (message: string, data?: unknown) => {
    const entry = formatLog('info', message, data)
    console.info(`[INFO] ${entry.timestamp} - ${message}`, data || '')
  },

  warn: (message: string, data?: unknown) => {
    const entry = formatLog('warn', message, data)
    console.warn(`[WARN] ${entry.timestamp} - ${message}`, data || '')
  },

  error: (message: string, data?: unknown) => {
    const entry = formatLog('error', message, data)
    console.error(`[ERROR] ${entry.timestamp} - ${message}`, data || '')
  },
}

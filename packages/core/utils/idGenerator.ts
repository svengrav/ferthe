/**
 * CUID2 Generator
 * Implementation of collision-resistant IDs without external dependencies
 */

// Constants for configuration
const BLOCK_SIZE = 4
const BASE_36_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'
const DISCRETE_VALUES = BASE_36_ALPHABET.length
const LARGE_SIZE = 20 // default length of a standard CUID2

// Counter to avoid collisions even with same-millisecond creation
let counter = 0

// Create a simple hash from a string
const hash = (input: string): number => {
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i)
    h |= 0 // Convert to 32bit integer
  }
  return Math.abs(h)
}

// Generate random blocks of characters
const getRandomBlock = (): string => {
  const buffer = new Uint8Array(BLOCK_SIZE)

  // Use crypto if available, otherwise fall back to Math.random
  globalThis.crypto.getRandomValues(buffer)

  // Convert to a number and then to base36
  const randomNumber = Array.from(buffer).reduce((acc, byte) => acc * 256 + byte, 0)

  return randomNumber.toString(36).padStart(BLOCK_SIZE, '0').slice(-BLOCK_SIZE)
}

// Create a fingerprint from the environment
const createFingerprint = (): string => {
  const hasWindow = typeof globalThis !== 'undefined' && 'navigator' in globalThis
  const navigator = hasWindow ? (globalThis as any).navigator : null
  const hasScreen = typeof globalThis !== 'undefined' && 'screen' in globalThis
  const screen = hasScreen ? (globalThis as any).screen : null

  const components = [
    navigator?.userAgent || '',
    new Date().getTimezoneOffset(),
    process?.env?.HOSTNAME || '',
    screen ? `${screen.width}x${screen.height}` : '',
  ]

  const fingerprint = hash(components.join('')).toString(36)
  return fingerprint.slice(-BLOCK_SIZE)
}

// Global fingerprint - calculated once
const FINGERPRINT = createFingerprint()

/**
 * Generates a collision-resistant unique identifier
 * @param length The length of the ID (default: 20)
 * @returns A string containing a collision-resistant ID
 */
export const createCuid2 = (length: number = LARGE_SIZE): string => {
  // Use counter to avoid collisions and increment it
  const count = (counter = (counter + 1) % DISCRETE_VALUES).toString(36)

  // Get current time component
  const time = Date.now().toString(36)

  // Initial components of the ID
  let id = time.slice(-BLOCK_SIZE) + FINGERPRINT + count

  // Fill the remaining length with random blocks
  while (id.length < length) {
    id += getRandomBlock()
  }

  // Trim to requested length
  return id.slice(0, length)
}

/**
 * Checks if a string is a valid CUID2
 * @param id The string to validate
 * @returns True if the string is a valid CUID2
 */
export const isCuid2 = (id: string): boolean => {
  if (typeof id !== 'string') return false
  if (id.length < 2) return false // Minimum practical length

  // Check that the ID only contains base36 characters
  return /^[0-9a-z]+$/i.test(id)
}

import { createHash } from 'node:crypto'

/**
 * Creates a deterministic ID based on the provided string arguments.
 * The ID is generated using SHA-256 hash of the concatenated arguments,
 * ensuring the same inputs always produce the same ID.
 *
 * @param args Array of strings to use for ID generation
 * @returns A deterministic 32-character hexadecimal string
 *
 * @example
 * // For a discovery ID based on account and spot
 * const discoveryId = createDeterministicId('account123', 'spot456')
 *
 * // For a discovery ID with trail
 * const trailDiscoveryId = createDeterministicId('account123', 'spot456', 'trail789')
 */
export function createDeterministicId(...args: string[]): string {
  if (args.length === 0) {
    throw new Error('At least one argument is required for deterministic ID generation')
  }

  const validArgs = args.filter(arg => arg != null && arg !== '')

  if (validArgs.length === 0) {
    throw new Error('At least one non-empty argument is required for deterministic ID generation')
  }

  // Sort arguments to ensure consistent ordering regardless of input order
  // This prevents issues where createDeterministicId('a', 'b') !== createDeterministicId('b', 'a')
  const sortedArgs = validArgs.slice().sort()

  // Create a consistent separator that's unlikely to appear in normal IDs
  const separator = ':::'
  const input = sortedArgs.join(separator)

  // Generate SHA-256 hash and take first 32 characters for a reasonable length ID
  const hash = createHash('sha256').update(input).digest('hex')
  return hash.substring(0, 32)
}

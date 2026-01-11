// JWT utility for secure Bearer token authentication
import { AccountSession } from '@shared/contracts'
import { createHmac } from 'crypto'

const JWT_DEVELOPMENT_SECRET = 'development'

export interface JWTService {
  createJWT: (session: AccountSession) => string
  verifyJWT: (token: string) => JWTPayload | null
}

interface JWTPayload {
  accountId: string
  accountType: 'sms_verified' | 'local_unverified' | 'public'
  iat: number
  exp: number
  iss: string
  aud: string
}

export const createJWTService = (options?: { secret?: string }): JWTService => {
  const { secret = JWT_DEVELOPMENT_SECRET } = options || {}

  const verifyJWT = (token: string): JWTPayload | null => {
    try {
      const [header, payload, signature] = token.split('.')

      if (!header || !payload || !signature) {
        return null
      }

      // Verify signature first
      const expectedSignature = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url')

      // Constant-time comparison to prevent timing attacks
      if (!constantTimeEquals(signature, expectedSignature)) {
        console.warn('JWT signature verification failed')
        return null
      }

      // Decode and validate payload
      const decoded = JSON.parse(base64UrlDecode(payload))

      // Check expiration
      if (decoded.exp < Math.floor(Date.now() / 1000)) {
        console.warn('JWT token expired')
        return null
      }

      // Validate required fields
      if (!decoded.accountId || !decoded.accountType || !decoded.iat || !decoded.exp) {
        console.warn('JWT payload missing required fields')
        return null
      }

      return decoded
    } catch (error) {
      console.warn('JWT verification error:', error)
      return null
    }
  }

  const createJWT = (session: AccountSession): string => {
    const payload: JWTPayload = {
      accountId: session.accountId,
      accountType: session.accountType,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(new Date(session.expiresAt).getTime() / 1000),
      iss: 'ferthe-api',
      aud: 'ferthe-app',
    }

    // Create header and payload
    const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payloadStr = base64UrlEncode(JSON.stringify(payload))

    // Create HMAC-SHA256 signature
    const signature = createHmac('sha256', secret).update(`${header}.${payloadStr}`).digest('base64url')

    return `${header}.${payloadStr}.${signature}`
  }

  return {
    createJWT,
    verifyJWT,
  }
}

/**
 * Base64 URL encoding (RFC 4648)
 * Removes padding and replaces chars for URL safety
 */
function base64UrlEncode(str: string): string {
  return Buffer.from(str, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Base64 URL decoding
 */
function base64UrlDecode(str: string): string {
  // Add padding if needed
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4)
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(base64, 'base64').toString('utf8')
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

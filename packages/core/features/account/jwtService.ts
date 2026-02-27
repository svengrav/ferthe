// JWT utility for secure Bearer token authentication
import { AccountSession } from '@shared/contracts/index.ts'
import { createHmac } from 'node:crypto'
import { z } from 'zod'

const JWT_DEVELOPMENT_SECRET = 'development'

export interface JWTService {
  createJWT: (session: AccountSession) => string
  verifyJWT: (token: string) => JWTPayload | null
}

const JWTPayloadSchema = z.object({
  accountId: z.string().min(1),
  accountType: z.enum(['sms_verified', 'local_unverified', 'public']),
  role: z.string().optional(),
  client: z.enum(['app', 'creator']).optional(),
  iat: z.number().int().positive(),
  exp: z.number().int().positive(),
  iss: z.literal('ferthe-api'),
  aud: z.enum(['ferthe-app', 'ferthe-creator']),
})

type JWTPayload = z.infer<typeof JWTPayloadSchema>

function isValidJWTPayload(value: unknown): value is JWTPayload {
  return JWTPayloadSchema.safeParse(value).success
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
      const expectedSignatureBase64 = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64')
      const expectedSignature = base64ToBase64Url(expectedSignatureBase64)

      // Constant-time comparison to prevent timing attacks
      if (!constantTimeEquals(signature, expectedSignature)) {
        console.warn('JWT signature verification failed')
        return null
      }

      // Decode and validate payload
      const decoded: unknown = JSON.parse(base64UrlDecode(payload))

      // Check expiration
      if (!isValidJWTPayload(decoded)) {
        console.warn('JWT payload failed schema validation')
        return null
      }

      if (decoded.exp < Math.floor(Date.now() / 1000)) {
        console.warn('JWT token expired')
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
      role: session.role,
      client: session.client ?? 'app',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(new Date(session.expiresAt).getTime() / 1000),
      iss: 'ferthe-api',
      aud: session.client === 'creator' ? 'ferthe-creator' : 'ferthe-app',
    }

    // Create header and payload
    const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payloadStr = base64UrlEncode(JSON.stringify(payload))

    // Create HMAC-SHA256 signature
    const signatureBase64 = createHmac('sha256', secret).update(`${header}.${payloadStr}`).digest('base64')
    const signature = base64ToBase64Url(signatureBase64)

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
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Convert standard base64 to base64url
 */
function base64ToBase64Url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Base64 URL decoding
 */
function base64UrlDecode(str: string): string {
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4)
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/')
  return atob(base64)
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

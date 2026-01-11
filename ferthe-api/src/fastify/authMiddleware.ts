// Minimal Bearer token authentication middleware
import { AccountApplicationActions } from '@core/features/account/accountApplication'

const extractBearerToken = (authHeader?: string): string | null => {
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.slice(7)
}

export interface AuthContext {
  accountId: string
  accountType: 'sms_verified' | 'local_unverified' | 'public'
}

/**
 * Creates a public context for unauthenticated routes
 */
export function createPublicContext(): AuthContext {
  return {
    accountId: 'public',
    accountType: 'public',
  }
}

/**
 * Factory function to create auth middleware with account application
 */
export function createAuthMiddleware(accountApplication: AccountApplicationActions) {
  return {
    /**
     * Minimal Bearer token authentication using accountApplication's JWT validation
     */
    async authenticateBearer(authHeader?: string): Promise<{ isValid: boolean; authContext?: AuthContext; error?: string }> {
      const token = extractBearerToken(authHeader)

      if (!token) {
        return {
          isValid: false,
          error: 'Missing Authorization header with Bearer token',
        }
      }

      // Use accountApplication's validateSession which has access to the JWT secret
      const validationResult = await accountApplication.validateSession(token)

      if (!validationResult.success || !validationResult.data?.valid) {
        return {
          isValid: false,
          error: 'Invalid or expired token',
        }
      }

      return {
        isValid: true,
        authContext: {
          accountId: validationResult.data.accountId,
          accountType: 'local_unverified', // AccountApplication doesn't return accountType in validation
        },
      }
    },
  }
}

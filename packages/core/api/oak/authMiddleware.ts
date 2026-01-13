import { AccountApplicationActions } from '@core/features/account/accountApplication.ts'

const extractBearerToken = (authHeader?: string | null): string | null => {
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
    async authenticateBearer(authHeader?: string | null): Promise<{ isValid: boolean; authContext?: AuthContext; error?: string }> {
      const token = extractBearerToken(authHeader)

      if (!token) {
        return {
          isValid: false,
          error: 'Missing Authorization header with Bearer token',
        }
      }

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
          accountType: 'local_unverified',
        },
      }
    },
  }
}

import { AccountApplicationActions } from '@core/features/account/accountApplication.ts'
import { AccountContext } from '@shared/contracts/accounts.ts'

const extractBearerToken = (authHeader?: string | null): string | null => {
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.slice(7)
}

export type { AccountContext as AuthContext }

/**
 * Creates a public context for unauthenticated routes
 */
export function createPublicContext(): AccountContext {
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
    async authenticateBearer(authHeader?: string | null): Promise<{ isValid: boolean; authContext?: AccountContext; error?: string }> {
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

      const session = validationResult.data
      return {
        isValid: true,
        authContext: {
          accountId: session.accountId,
          accountType: session.accountType || 'local_unverified',
          role: session.role,
          client: session.client,
        },
      }
    },
  }
}

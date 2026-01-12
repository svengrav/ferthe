// Account service - pure business logic functions for user authentication
import { Account, AccountSession } from '@shared/contracts'

interface SMSLoginResult {
  success: boolean
  accountId?: string
  error?: string
}

export interface AccountServiceActions {
  // SMS Authentication Flow - pure business logic
  formatSMSLoginResult(account: AccountSession): SMSLoginResult
  formatSMSCodeResult(result: { requestId: string; expiresIn: number }): { success: boolean; expiresIn?: number; error?: string }

  // Session Validation Logic
  isSessionExpired(expiresAt: Date): boolean
  calculateSessionTimeRemaining(expiresAt: Date): number

  // User Account Business Logic
  formatAccountForDisplay(account: Account): any

  // Session Status Logic
  createSessionInfo(isValid: boolean, accountId: string | null): { isValid: boolean; accountId: string | null; expiresAt: Date | null }

  // New methods for local account support
  formatLocalAccountResult(authSession: AccountSession): SMSLoginResult
  canUserAccessFeature(accountType: 'sms_verified' | 'local_unverified' | null, featureName: string): boolean
  getAccountTypeDisplayName(accountType: 'sms_verified' | 'local_unverified' | null): string
  shouldPromptPhoneVerification(accountType: 'sms_verified' | 'local_unverified' | null, featureName?: string): boolean
}

export function createAccountService(): AccountServiceActions {
  return {
    // Pure business logic functions
    formatSMSLoginResult(authSession: AccountSession): SMSLoginResult {
      return {
        success: true,
        accountId: authSession.accountId,
      }
    },

    formatSMSCodeResult(result: { requestId: string; expiresIn: number }): { success: boolean; expiresIn?: number; error?: string } {
      return {
        success: true,
        expiresIn: result.expiresIn,
      }
    },

    isSessionExpired(expiresAt: Date): boolean {
      return new Date() >= expiresAt
    },

    calculateSessionTimeRemaining(expiresAt: Date): number {
      const remaining = expiresAt.getTime() - new Date().getTime()
      return Math.max(0, Math.floor(remaining / (1000 * 60))) // in minutes
    },

    formatAccountForDisplay(account: Account): any {
      return {
        accountId: account.id,
        createdAt: account.createdAt,
        lastLoginAt: account.lastLoginAt,
      }
    },

    createSessionInfo(isValid: boolean, accountId: string | null): { isValid: boolean; accountId: string | null; expiresAt: Date | null } {
      return {
        isValid,
        accountId,
        expiresAt: null, // Could be enhanced later
      }
    },

    // New methods for local account support
    formatLocalAccountResult(authSession: AccountSession): SMSLoginResult {
      return {
        success: true,
        accountId: authSession.accountId,
      }
    },

    canUserAccessFeature(accountType: 'sms_verified' | 'local_unverified' | null, featureName: string): boolean {
      if (!accountType) return false

      // Define features that require phone verification
      const phoneVerificationRequired = ['premium_content', 'cross_device_sync', 'social_features', 'advanced_sharing', 'user_profile_public', 'friend_invites']

      // Local accounts can't access phone-verification-required features
      if (accountType === 'local_unverified' && phoneVerificationRequired.includes(featureName)) {
        return false
      }

      return true
    },

    getAccountTypeDisplayName(accountType: 'sms_verified' | 'local_unverified' | null): string {
      switch (accountType) {
        case 'sms_verified':
          return 'Verified Account'
        case 'local_unverified':
          return 'Local Account'
        default:
          return 'No Account'
      }
    },

    shouldPromptPhoneVerification(accountType: 'sms_verified' | 'local_unverified' | null, featureName?: string): boolean {
      // Only prompt for local accounts
      if (accountType !== 'local_unverified') {
        return false
      }

      // If accessing a restricted feature, prompt for verification
      if (featureName && !this.canUserAccessFeature(accountType, featureName)) {
        return true
      }

      // General prompting logic - could be based on usage patterns, time since creation, etc.
      return false
    },
  }
}

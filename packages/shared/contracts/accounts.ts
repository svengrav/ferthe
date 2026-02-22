import { FirebaseConfig } from './config.ts'
import { ImageReference } from './images.ts'
import { Result } from './results.ts'

export interface AccountApplicationContract {
  // Authentication - No context needed (creating sessions)
  requestSMSCode: (phoneNumber: string, deviceInfo?: AccountDeviceInfo) => Promise<Result<SMSCodeRequest>>
  verifySMSCode: (phoneNumber: string, code: string, deviceInfo?: AccountDeviceInfo) => Promise<Result<SMSVerificationResult>>
  createLocalAccount: (deviceInfo?: AccountDeviceInfo) => Promise<Result<AccountSession>>

  // Session management - Token-based, no context needed
  validateSession: (sessionToken: string) => Promise<Result<SessionValidationResult>>
  revokeSession: (sessionToken: string) => Promise<Result<void>>

  // Account operations - Require authenticated context
  getAccount: (context: AccountContext) => Promise<Result<Account | null>>
  updateAccount: (context: AccountContext, data: AccountUpdateData) => Promise<Result<Account>>
  upgradeToPhoneAccount: (context: AccountContext, phoneNumber: string, code: string) => Promise<Result<AccountSession>>

  // Avatar management
  uploadAvatar: (context: AccountContext, base64Data: string) => Promise<Result<Account>>

  // Configuration - Require authenticated context
  getFirebaseConfig: (context: AccountContext) => Promise<Result<FirebaseConfig>>

  // Public profile
  getPublicProfile: (context: AccountContext, accountId: string) => Promise<Result<AccountPublicProfile>>

  // Push notification device tokens
  registerDeviceToken: (context: AccountContext, token: string, platform: DevicePlatform) => Promise<Result<DeviceToken>>
  removeDeviceToken: (context: AccountContext, token: string) => Promise<Result<void>>
}

/**
 * Public-facing account profile, safe to expose to any authenticated user.
 */
export interface AccountPublicProfile {
  accountId: string
  displayName?: string
  avatar?: ImageReference
  spotCount: number
}

/**
 * Represents the type of account based on verification status.
 * - 'sms_verified' indicates a verified account with a phone number,
 * - 'local_unverified' indicates a local account without phone verification,
 * - 'public' indicates a public account without any phone or local verification.
 */
export type AccountType = 'sms_verified' | 'local_unverified' | 'public'

/**
 * Represents an account in the system.
 * Contains the account ID, optional phone hash (verified only), creation date, last login date,
 */
export interface Account {
  id: string
  phoneHash?: string // Optional for local accounts
  displayName?: string // Optional display name set by user
  description?: string // Optional profile description
  avatar?: ImageReference // Avatar image (generated on-demand)
  createdAt: Date
  lastLoginAt?: Date
  updatedAt?: Date
  accountType: AccountType
  isPhoneVerified: boolean
}

/**
 * Represents the context of an account, which includes the account ID and type.
 * - This context is used to perform operations that require knowledge of the account.
 * - This is the short version of a session.
 */
export interface AccountContext {
  accountId: string
  accountType: AccountType
}

/**
 * Data for updating an account
 */
export interface AccountUpdateData {
  displayName?: string
  description?: string
}

/**
 * Represents a session for an account, which includes the session token,
 * expiration time, and associated account context.
 * - Extends the AccountContext to include session-specific information.
 */
export interface AccountSession extends AccountContext {
  id: string
  accountId: string
  sessionToken: string
  expiresAt: Date
  accountType: AccountType
}

/**
 * Represents device information associated with an account session.
 * - Contains details such as device ID, platform, OS version, IP address, and geolocation.
 */
export interface AccountDeviceInfo {
  readonly deviceId: string
  readonly platform?: 'ios' | 'android' | 'web'
  readonly osVersion?: string
  readonly ipAddress?: string
  readonly geolocation?: {
    latitude: number
    longitude: number
    accuracy?: number
  }
}

/**
 * Represents a Twilio verification request.
 * - Phone number is never stored in plaintext, only as irreversible hash
 * - verificationSid is provided by Twilio Verify API for code verification
 */
export interface TwilioVerification {
  id: string
  phoneHash: string // Hashed phone number for security (argon2)
  verificationSid: string // Twilio Verify API verification SID
  expiresAt: Date
  createdAt: Date
  verified: boolean
}

/**
 * Represents a request for an SMS verification code.
 * Contains the request ID, expiration time.
 * This is used to track the SMS request and its validity.
 * - ⚠️ Code has to be sent to the user's phone number.
 * - This is a simplified version of SMSCodeRequest that does not include the code itself.
 */
export interface SMSCodeRequest {
  requestId: string
  expiresAt: Date
}

/**
 * Represents the result of an SMS verification attempt.
 * Contains the success status, optional account context, and error details if any.
 */
export interface SMSVerificationResult {
  success: boolean
  context?: AccountSession
  error?: string
  errorCode?: 'NO_REQUEST' | 'INVALID_CODE' | 'EXPIRED_CODE' | 'ALREADY_VERIFIED'
}

/**
 * Represents the result of validating a session.
 */
export interface SessionValidationResult {
  accountId: string
  valid: boolean
}

export type DevicePlatform = 'ios' | 'android'

export interface DeviceToken {
  id: string
  accountId: string
  token: string
  platform: DevicePlatform
  updatedAt: Date
}

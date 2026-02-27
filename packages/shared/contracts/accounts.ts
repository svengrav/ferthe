import { z } from 'zod'
import { FirebaseConfig } from './config.ts'
import { ImageReferenceSchema } from './images.ts'
import { Result } from './results.ts'

// ──────────────────────────────────────────────────────────────
// Zod Schemas (Source of Truth)
// ──────────────────────────────────────────────────────────────

/**
 * Account type enum
 */
export const AccountTypeSchema = z.enum(['sms_verified', 'local_unverified', 'public'])

/**
 * Device platform enum
 */
export const DevicePlatformSchema = z.enum(['ios', 'android'])

/**
 * Account public profile schema
 */
export const AccountPublicProfileSchema = z.object({
  accountId: z.string(),
  displayName: z.string().optional(),
  avatar: ImageReferenceSchema.optional(),
  spotCount: z.number().int(),
})

/**
 * Account schema
 */
export const AccountSchema = z.object({
  id: z.string(),
  phoneHash: z.string().optional(),
  displayName: z.string().optional(),
  description: z.string().optional(),
  avatar: ImageReferenceSchema.optional(),
  createdAt: z.date(),
  lastLoginAt: z.date().optional(),
  updatedAt: z.date().optional(),
  accountType: AccountTypeSchema,
  isPhoneVerified: z.boolean(),
})

/**
 * Account context schema
 */
export const AccountContextSchema = z.object({
  accountId: z.string(),
  accountType: AccountTypeSchema,
})

/**
 * Account update data schema
 */
export const AccountUpdateDataSchema = z.object({
  displayName: z.string().optional(),
  description: z.string().optional(),
})

/**
 * Account session schema
 */
export const AccountSessionSchema = AccountContextSchema.extend({
  id: z.string(),
  accountId: z.string(),
  sessionToken: z.string(),
  expiresAt: z.date(),
  accountType: AccountTypeSchema,
})

/**
 * Account device info schema
 */
export const AccountDeviceInfoSchema = z.object({
  deviceId: z.string(),
  platform: z.enum(['ios', 'android', 'web']).optional(),
  osVersion: z.string().optional(),
  ipAddress: z.string().optional(),
  geolocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().optional(),
  }).optional(),
})

/**
 * Twilio verification schema
 */
export const TwilioVerificationSchema = z.object({
  id: z.string(),
  phoneHash: z.string(),
  verificationSid: z.string(),
  expiresAt: z.date(),
  createdAt: z.date(),
  verified: z.boolean(),
})

/**
 * SMS code request schema
 */
export const SMSCodeRequestSchema = z.object({
  requestId: z.string(),
  expiresAt: z.date(),
})

/**
 * SMS verification result schema
 */
export const SMSVerificationResultSchema = z.object({
  success: z.boolean(),
  context: AccountSessionSchema.optional(),
  error: z.string().optional(),
  errorCode: z.enum(['NO_REQUEST', 'INVALID_CODE', 'EXPIRED_CODE', 'ALREADY_VERIFIED']).optional(),
})

/**
 * Session validation result schema
 */
export const SessionValidationResultSchema = z.object({
  accountId: z.string(),
  valid: z.boolean(),
})

/**
 * Device token schema
 */
export const DeviceTokenSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  token: z.string(),
  platform: DevicePlatformSchema,
  updatedAt: z.date(),
})

// ──────────────────────────────────────────────────────────────
// TypeScript Types (Inferred from Zod Schemas)
// ──────────────────────────────────────────────────────────────

export type AccountType = z.infer<typeof AccountTypeSchema>
export type DevicePlatform = z.infer<typeof DevicePlatformSchema>
export type AccountPublicProfile = z.infer<typeof AccountPublicProfileSchema>
export type Account = z.infer<typeof AccountSchema>
export type AccountContext = z.infer<typeof AccountContextSchema>
export type AccountUpdateData = z.infer<typeof AccountUpdateDataSchema>
export type AccountSession = z.infer<typeof AccountSessionSchema>
export type AccountDeviceInfo = z.infer<typeof AccountDeviceInfoSchema>
export type TwilioVerification = z.infer<typeof TwilioVerificationSchema>
export type SMSCodeRequest = z.infer<typeof SMSCodeRequestSchema>
export type SMSVerificationResult = z.infer<typeof SMSVerificationResultSchema>
export type SessionValidationResult = z.infer<typeof SessionValidationResultSchema>
export type DeviceToken = z.infer<typeof DeviceTokenSchema>

// ──────────────────────────────────────────────────────────────
// Application Contract (unchanged)
// ──────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────
// Application Contract (unchanged)
// ──────────────────────────────────────────────────────────────

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

  // Dev tools
  createDevSession: (accountId: string) => Promise<Result<AccountSession>>
}

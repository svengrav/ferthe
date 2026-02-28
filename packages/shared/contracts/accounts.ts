import { z } from 'zod'
import { FirebaseConfig } from './config.ts'
import { ImageReferenceSchema } from './images.ts'
import { Result } from './results.ts'
import { guard } from './strings.ts'

// ──────────────────────────────────────────────────────────────
// Zod Schemas (Source of Truth)
// ──────────────────────────────────────────────────────────────

/**
 * Account type enum
 */
export const AccountTypeSchema = z.enum(['sms_verified', 'local_unverified', 'public'])

/**
 * Client audience — which app the token was issued for
 */
export const ClientAudienceSchema = z.enum(['app', 'creator'])
export type ClientAudience = z.infer<typeof ClientAudienceSchema>

/**
 * Account role enum
 */
export const AccountRoleSchema = z.enum(['user', 'creator', 'admin'])

/**
 * Device platform enum
 */
export const DevicePlatformSchema = z.enum(['ios', 'android'])

/**
 * Account public profile schema
 */
export const AccountPublicProfileSchema = z.object({
  accountId: guard.idString,
  displayName: guard.shortTextOptional,
  avatar: ImageReferenceSchema.optional(),
  spotCount: guard.nonNegativeInt,
})

/**
 * Account schema
 */
export const AccountSchema = z.object({
  id: guard.idString,
  phoneHash: guard.phoneHash.optional(),
  displayName: guard.shortTextOptional,
  description: guard.mediumTextOptional,
  avatar: ImageReferenceSchema.optional(),
  createdAt: z.date(),
  lastLoginAt: z.date().optional(),
  updatedAt: z.date().optional(),
  accountType: AccountTypeSchema,
  isPhoneVerified: z.boolean(),
  role: AccountRoleSchema.optional(),
})

/**
 * Account context schema
 */
export const AccountContextSchema = z.object({
  accountId: guard.idString,
  accountType: AccountTypeSchema,
  role: AccountRoleSchema.optional(),
  client: ClientAudienceSchema.optional(),
})

/**
 * Account update data schema
 */
export const AccountUpdateDataSchema = z.object({
  displayName: guard.shortTextOptional,
  description: guard.mediumTextOptional,
})

/**
 * Account session schema
 */
export const AccountSessionSchema = AccountContextSchema.extend({
  id: guard.idString,
  accountId: guard.idString,
  sessionToken: guard.token,
  expiresAt: z.date(),
  accountType: AccountTypeSchema,
  role: AccountRoleSchema.optional(),
})

/**
 * Account device info schema
 */
export const AccountDeviceInfoSchema = z.object({
  deviceId: guard.idString,
  platform: z.enum(['ios', 'android', 'web']).optional(),
  osVersion: guard.osVersion,
  ipAddress: guard.ipAddress,
  geolocation: z.object({
    latitude: guard.latitude,
    longitude: guard.longitude,
    accuracy: z.number().optional(),
  }).optional(),
})

/**
 * Twilio verification schema
 */
export const TwilioVerificationSchema = z.object({
  id: guard.idString,
  phoneHash: guard.phoneHash,
  verificationSid: guard.idString,
  expiresAt: z.date(),
  createdAt: z.date(),
  verified: z.boolean(),
})

/**
 * SMS code request schema
 */
export const SMSCodeRequestSchema = z.object({
  requestId: guard.idString,
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
  accountId: guard.idString,
  valid: z.boolean(),
  role: AccountRoleSchema.optional(),
  accountType: AccountTypeSchema.optional(),
  client: ClientAudienceSchema.optional(),
})

/**
 * Device token schema
 */
export const DeviceTokenSchema = z.object({
  id: guard.idString,
  accountId: guard.idString,
  token: guard.token,
  platform: DevicePlatformSchema,
  updatedAt: z.date(),
})

// ──────────────────────────────────────────────────────────────
// TypeScript Types (Inferred from Zod Schemas)
// ──────────────────────────────────────────────────────────────

export type AccountType = z.infer<typeof AccountTypeSchema>
export type AccountRole = z.infer<typeof AccountRoleSchema>
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
  verifySMSCode: (phoneNumber: string, code: string, client?: ClientAudience, deviceInfo?: AccountDeviceInfo) => Promise<Result<SMSVerificationResult>>
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

// SMS service for phone authentication - pure functional code generation and validation
import { SMSRequest } from '@core/connectors/smsConnector.ts'
import { createCuid2 } from '@core/utils/idGenerator.ts'
import { SMSCode } from '@shared/contracts/index.ts'
import { hash, verify } from 'npm:argon2'
const DEVELOPER_HASH_SALT = 'ferthe-developer-salt'

export interface SMSValidationResult {
  valid: boolean
  errorCode?: 'ALREADY_VERIFIED' | 'EXPIRED_CODE' | 'INVALID_CODE'
  errorMessage?: string
}

export interface SMSService {
  generateCodeRequest: (phoneNumber: string) => Promise<SMSCode>
  validateCode: (smsRequest: SMSCode, code: string) => boolean
  validateCodeWithErrorDetails: (smsRequest: SMSCode, code: string) => SMSValidationResult
  isRequestExpired: (smsRequest: SMSCode) => boolean
  createPhoneHash: (phoneNumber: string) => Promise<string>
  verifyPhoneHash: (phoneNumber: string, phoneHash: string) => Promise<boolean>
  createSMSMessage: (phoneNumber: string, code: string, expiresAt: Date, requestId: string) => SMSRequest
  validatePhoneNumber: (phoneNumber: string) => { valid: boolean; error?: string }
}

interface SMSServiceOptions {
  phoneSalt?: string
  codeLength?: number
  saltRounds?: number
  expiryMinutes?: number
}

export function createSMSService(options: SMSServiceOptions = {}): SMSService {
  const { codeLength = 6, expiryMinutes = 5, phoneSalt = DEVELOPER_HASH_SALT, saltRounds = 12 } = options

  const createPhoneHash = async (phoneNumber: string): Promise<string> => {
    try {
      // Combine phone number with salt to create consistent input for hashing
      const phoneWithSalt = phoneNumber + phoneSalt

      // Use bcrypt to create secure hash
      const phoneHash = await hash(phoneWithSalt)

      return phoneHash
    } catch (error) {
      console.error('Error creating phone hash:', error)
      throw new Error('Failed to create secure phone hash')
    }
  }

  const verifyPhoneHash = async (phoneNumber: string, phoneHash: string): Promise<boolean> => {
    try {
      const phoneWithSalt = phoneNumber + phoneSalt

      // Use bcrypt.compare to check if phone number matches stored hash
      return await verify(phoneHash, phoneWithSalt)
    } catch (error) {
      console.error('Error verifying phone hash:', error)
      return false
    }
  }

  const validatePhoneNumber = (phoneNumber: string): { valid: boolean; error?: string } => {
    // Remove all non-digit characters for validation
    const cleanPhone = phoneNumber.replace(/\D/g, '')

    // Check if phone number is empty
    if (!phoneNumber.trim()) {
      return { valid: false, error: 'Phone number is required' }
    }

    // Check for minimum length (at least 7 digits for local numbers)
    if (cleanPhone.length < 7) {
      return { valid: false, error: 'Phone number too short (minimum 7 digits)' }
    }

    // Check for maximum length (max 15 digits per E.164 standard)
    if (cleanPhone.length > 15) {
      return { valid: false, error: 'Phone number too long (maximum 15 digits)' }
    }

    // Check for valid international format (starts with +)
    const internationalFormat = /^\+[1-9]\d{6,14}$/
    if (phoneNumber.startsWith('+')) {
      if (!internationalFormat.test(phoneNumber)) {
        return { valid: false, error: 'Invalid international format (use +[country code][number])' }
      }
      return { valid: true }
    }

    // Check for German mobile format (starts with 01)
    const germanMobileFormat = /^01[5-9]\d{8,9}$/
    if (germanMobileFormat.test(cleanPhone)) {
      return { valid: true }
    }

    // Check for German landline format (area code + number)
    const germanLandlineFormat = /^0[2-9]\d{7,11}$/
    if (germanLandlineFormat.test(cleanPhone)) {
      return { valid: true }
    }

    // Check for US/Canada format (10 digits)
    const northAmericaFormat = /^[2-9]\d{9}$/
    if (northAmericaFormat.test(cleanPhone)) {
      return { valid: true }
    }

    return { valid: false, error: 'Invalid phone number format' }
  }

  const createSMSMessage = (phoneNumber: string, code: string, expiresAt: Date, requestId: string): SMSRequest => {
    return {
      phoneNumber,
      message: `Your verification code is: ${code}. This code expires at ${expiresAt.toISOString()}.`,
      metadata: {
        code,
        expiresAt,
        requestId,
      },
    }
  }

  const generateCodeRequest = async (phoneNumber: string): Promise<SMSCode> => {
    // Generate random numeric code
    const code = Array.from({ length: codeLength }, () => Math.floor(Math.random() * 10)).join('')

    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes)

    // Create secure hash of phone number
    const phoneHash = await createPhoneHash(phoneNumber)
    const smsRequest: SMSCode = {
      id: createCuid2(),
      phoneHash,
      code,
      expiresAt,
      createdAt: new Date(),
      verified: false,
    }

    // Note: SMS sending is now handled by the application layer using createSMSMessage

    return smsRequest
  }

  const validateCode = (smsRequest: SMSCode, code: string): boolean => {
    // Check if already verified
    if (smsRequest.verified) {
      console.log(`SMS code already verified for request: ${smsRequest.id}`)
      return false
    }

    // Check if expired
    if (new Date() > smsRequest.expiresAt) {
      console.log(`SMS code expired for request: ${smsRequest.id}`)
      return false
    }

    // Check if code matches
    if (smsRequest.code !== code) {
      console.log(`Invalid SMS code for request: ${smsRequest.id}`)
      return false
    }

    console.log(`SMS code successfully validated for request: ${smsRequest.id}`)
    return true
  }
  const validateCodeWithErrorDetails = (smsRequest: SMSCode, code: string): SMSValidationResult => {
    // Check if already verified
    if (smsRequest.verified) {
      console.log(`SMS code already verified for request: ${smsRequest.id}`)
      return {
        valid: false,
        errorCode: 'ALREADY_VERIFIED',
        errorMessage: 'SMS code already verified',
      }
    }

    // Check if expired
    if (new Date() > smsRequest.expiresAt) {
      console.log(`SMS code expired for request: ${smsRequest.id}`)
      return {
        valid: false,
        errorCode: 'EXPIRED_CODE',
        errorMessage: 'SMS code has expired',
      }
    }

    // Check if code matches
    if (smsRequest.code !== code) {
      console.log(`Invalid SMS code for request: ${smsRequest.id}`)
      return {
        valid: false,
        errorCode: 'INVALID_CODE',
        errorMessage: 'Invalid SMS code',
      }
    }

    console.log(`SMS code successfully validated for request: ${smsRequest.id}`)
    return {
      valid: true,
    }
  }

  const isRequestExpired = (smsRequest: SMSCode): boolean => {
    return new Date() > smsRequest.expiresAt
  }
  return {
    generateCodeRequest,
    validateCode,
    validateCodeWithErrorDetails,
    isRequestExpired,
    createPhoneHash,
    verifyPhoneHash,
    createSMSMessage,
    validatePhoneNumber,
  }
}

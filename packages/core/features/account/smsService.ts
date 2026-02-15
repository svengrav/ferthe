// Phone hash service for secure phone number storage
// Using SHA-256 with hex encoding for simple, portable hash storage

const DEVELOPER_HASH_SALT = 'ferthe-developer-salt'

export interface SMSService {
  createPhoneHash: (phoneNumber: string) => Promise<string>
  verifyPhoneHash: (phoneNumber: string, phoneHash: string) => Promise<boolean>
  validatePhoneNumber: (phoneNumber: string) => { valid: boolean; error?: string }
  normalizePhoneNumber: (phoneNumber: string, defaultCountryCode?: string) => string
}

interface SMSServiceOptions {
  phoneSalt?: string
}

export function createSMSService(options: SMSServiceOptions = {}): SMSService {
  const { phoneSalt = DEVELOPER_HASH_SALT } = options

  const createPhoneHash = async (phoneNumber: string): Promise<string> => {
    try {
      // Combine phone number with salt to create consistent input for hashing
      const phoneWithSalt = phoneNumber + phoneSalt

      // Use Web Crypto API for SHA-256 hashing
      const encoder = new TextEncoder()
      const data = encoder.encode(phoneWithSalt)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)

      // Convert to hex string
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const phoneHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      return phoneHash
    } catch (error) {
      console.error('Error creating phone hash:', error)
      throw new Error('Failed to create secure phone hash')
    }
  }

  const verifyPhoneHash = async (phoneNumber: string, phoneHash: string): Promise<boolean> => {
    try {
      // Check if phoneHash is in valid hex format
      if (!phoneHash || !/^[a-f0-9]{64}$/i.test(phoneHash)) {
        console.warn('Invalid phoneHash format - expected 64-character hex string')
        return false
      }

      // Create hash from phone number and compare
      const calculatedHash = await createPhoneHash(phoneNumber)

      // Case-insensitive comparison
      return calculatedHash.toLowerCase() === phoneHash.toLowerCase()
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

  const normalizePhoneNumber = (phoneNumber: string, defaultCountryCode: string = '+49'): string => {
    // If already in international format, return as is
    if (phoneNumber.startsWith('+')) {
      return phoneNumber
    }

    // If starts with common country code without + (e.g., 49, 1, 43, 41), just add +
    const commonCountryCodes = ['1', '49', '43', '41', '44', '33', '34', '39', '31', '32']
    for (const code of commonCountryCodes) {
      if (phoneNumber.startsWith(code)) {
        // Check if it's likely a country code (not just a regular number starting with these digits)
        // For single digit codes (like 1), check if followed by area code
        // For multi-digit codes, assume it's a country code if long enough
        if (code === '1' && phoneNumber.length >= 11) {
          return '+' + phoneNumber
        } else if (code !== '1' && phoneNumber.length >= 10) {
          return '+' + phoneNumber
        }
      }
    }

    // If starts with 0, replace with country code
    if (phoneNumber.startsWith('0')) {
      // Remove leading 0 and add country code
      return defaultCountryCode + phoneNumber.substring(1)
    }

    // If no prefix, assume it needs country code
    return defaultCountryCode + phoneNumber
  }

  return {
    createPhoneHash,
    verifyPhoneHash,
    validatePhoneNumber,
    normalizePhoneNumber,
  }
}


// SMS connector interface for Twilio Verify API
import Twilio from 'twilio'

export interface TwilioVerificationRequest {
  verificationSid: string
  expiresAt: Date
}

export interface TwilioVerificationResult {
  success: boolean
  error?: string
}

export interface SMSConnector {
  requestVerification: (phoneNumber: string) => Promise<TwilioVerificationRequest>
  verifyCode: (phoneNumber: string, code: string) => Promise<TwilioVerificationResult>
}

export interface TwilioConfig {
  accountSid: string
  authToken: string
  verifyServiceId: string
}

// Twilio Verify API implementation
export function createTwilioSMSConnector(config: TwilioConfig): SMSConnector {
  const client = Twilio(config.accountSid, config.authToken)

  const requestVerification = async (phoneNumber: string): Promise<TwilioVerificationRequest> => {
    try {
      const verification = await client.verify.v2
        .services(config.verifyServiceId)
        .verifications
        .create({ to: phoneNumber, channel: 'sms' })

      // Twilio verifications expire in 10 minutes by default
      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + 10)

      return {
        verificationSid: verification.sid,
        expiresAt,
      }
    } catch (error) {
      console.error('Twilio requestVerification Error:', error)
      throw new Error(error instanceof Error ? error.message : 'Unknown Twilio error')
    }
  }

  const verifyCode = async (phoneNumber: string, code: string): Promise<TwilioVerificationResult> => {
    try {
      const verificationCheck = await client.verify.v2
        .services(config.verifyServiceId)
        .verificationChecks
        .create({ to: phoneNumber, code })

      return {
        success: verificationCheck.status === 'approved',
        error: verificationCheck.status !== 'approved' ? `Verification status: ${verificationCheck.status}` : undefined,
      }
    } catch (error) {
      console.error('Twilio verifyCode Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Twilio error',
      }
    }
  }

  return {
    requestVerification,
    verifyCode,
  }
}

// Console log implementation for development
export function createConsoleSMSConnector(): SMSConnector {
  const requestVerification = (phoneNumber: string): Promise<TwilioVerificationRequest> => {
    console.log(
      {
        phone: phoneNumber,
        action: 'requestVerification',
      },
      '📱 SMS Connector - Requesting verification'
    )

    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 10)

    return Promise.resolve({
      verificationSid: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      expiresAt,
    })
  }

  const verifyCode = (phoneNumber: string, code: string): Promise<TwilioVerificationResult> => {
    console.log(
      {
        phone: phoneNumber,
        code,
        action: 'verifyCode',
      },
      '📱 SMS Connector - Verifying code'
    )

    // In development, accept code "123456"
    const success = code === '123456'

    return Promise.resolve({
      success,
      error: success ? undefined : 'Invalid code (use 123456 for dev)',
    })
  }

  return {
    requestVerification,
    verifyCode,
  }
}


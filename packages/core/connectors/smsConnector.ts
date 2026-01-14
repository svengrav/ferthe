// SMS connector interface for sending SMS messages
import Twilio from 'twilio'

export interface SMSRequest {
  phoneNumber: string
  message: string
  metadata?: {
    code?: string
    expiresAt?: Date
    requestId?: string
  }
}

export interface SMSResponse {
  success: boolean
  messageId?: string
  error?: string
}

export interface SMSConnector {
  sendSMS: (request: SMSRequest) => Promise<SMSResponse>
}

export interface TwilioConfig {
  accountSid: string
  authToken: string
  fromNumber: string
}

// Twilio implementation for production
export function createTwilioSMSConnector(config: TwilioConfig): SMSConnector {
  const client = Twilio(config.accountSid, config.authToken)

  const sendSMS = async (request: SMSRequest): Promise<SMSResponse> => {
    try {
      const { phoneNumber, message } = request

      const twilioMessage = await client.messages.create({
        body: message,
        from: config.fromNumber,
        to: phoneNumber,
      })

      return {
        success: true,
        messageId: twilioMessage.sid,
      }
    } catch (error) {
      console.error('Twilio SMS Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Twilio SMS error',
      }
    }
  }

  return {
    sendSMS,
  }
}

// Console log implementation for development
export function createConsoleSMSConnector(): SMSConnector {
  const sendSMS = async (request: SMSRequest): Promise<SMSResponse> => {
    try {
      const { phoneNumber, message, metadata } = request

      // Log SMS details (development only)
      console.log(
        {
          phone: phoneNumber,
          message,
          code: metadata?.code,
          expiresAt: metadata?.expiresAt?.toISOString(),
          requestId: metadata?.requestId,
        },
        '📱 SMS Connector - Sending SMS'
      )

      // Simulate successful SMS sending
      const messageId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      return {
        success: true,
        messageId,
      }
    } catch (error) {
      console.log('SMS Connector Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown SMS error',
      }
    }
  }

  return {
    sendSMS,
  }
}

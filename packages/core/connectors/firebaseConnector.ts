// Firebase Cloud Messaging connector using FCM HTTP v1 API
// Uses native Web Crypto API for JWT signing (no external dependencies)

import { FirebaseServiceAccount } from '@core/config/secrets.ts'

const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'

export interface FirebaseConnector {
  sendPushNotification: (options: PushNotificationOptions) => Promise<void>
}

export interface PushNotificationOptions {
  token: string
  userContent?: { title: string; body: string }
  appData?: Record<string, string>
}

// Base64url encode without padding
function base64url(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function textToBase64url(text: string): string {
  return base64url(new TextEncoder().encode(text))
}

// Import PEM private key for RS256 signing
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemBody = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '')
  const binary = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0))

  return crypto.subtle.importKey(
    'pkcs8',
    binary,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
}

// Create a signed JWT for Google OAuth2 service account auth
async function createSignedJWT(serviceAccount: FirebaseServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = textToBase64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = textToBase64url(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: FCM_SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }))

  const signingInput = `${header}.${payload}`
  const key = await importPrivateKey(serviceAccount.private_key)
  const signature = new Uint8Array(
    await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput))
  )

  return `${signingInput}.${base64url(signature)}`
}

// Exchange signed JWT for a Google OAuth2 access token
async function getAccessToken(serviceAccount: FirebaseServiceAccount): Promise<string> {
  const jwt = await createSignedJWT(serviceAccount)
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get Google access token: ${error}`)
  }

  const data = await response.json()
  return data.access_token
}

/** Sends a push notification to a single device via FCM HTTP v1 API */
async function sendPushNotification(
  serviceAccount: FirebaseServiceAccount,
  { token, userContent, appData = {} }: PushNotificationOptions
): Promise<void> {
  const accessToken = await getAccessToken(serviceAccount)
  const url = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`

  const message: Record<string, unknown> = {
    token,
    data: appData,
    android: { priority: 'high' },
  }
  if (userContent) {
    message.notification = { title: userContent.title, body: userContent.body }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`FCM send failed (${response.status}): ${error}`)
  }
}

// Factory: creates a firebase connector bound to a service account
export function createFirebaseConnector(serviceAccount: FirebaseServiceAccount): FirebaseConnector {
  return {
    sendPushNotification: (options) => sendPushNotification(serviceAccount, options),
  }
}

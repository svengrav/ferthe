// import axios from 'axios'
// // @ts-ignore
// import { JWT } from 'google-auth-library'

// const SCOPES = ['https://www.googleapis.com/auth/firebase.messaging']

// async function getAccessToken(): Promise<string> {
//   try {
//     // JWT-Client directly with service account content from config
//     if (!API_CONFIG.firebase.serviceAccount) throw new Error('Firebase service account is not set')
//     const jwtClient = new JWT({
//       email: API_CONFIG.firebase.serviceAccount.client_email,
//       key: API_CONFIG.firebase.serviceAccount.private_key,
//       scopes: SCOPES,
//     })

//     // Get token
//     const token = await jwtClient.getAccessToken()
//     if (!token || !token.token) throw new Error('Unable to get access token for FCM')
//     return token.token
//   } catch (error) {
//     console.error('Error getting access token:', error)
//     throw error
//   }
// }

// /**
//  * Sends a push notification to a device
//  * @param options Options for the notification
//  * @param options.token FCM device token
//  * @param options.userContent Content visible to the user in the notification
//  * @param options.userContent.title Title shown in the notification
//  * @param options.userContent.body Body text shown in the notification
//  * @param options.appData Data intended for application processing, not shown to the user
//  */
// export async function sendPushNotification({
//   token,
//   userContent,
//   appData = {},
// }: {
//   token: string
//   userContent?: {
//     title: string
//     body: string
//   }
//   appData?: Record<string, any>
// }) {
//   if (!API_CONFIG.firebase.serviceAccount || !token) return

//   const accessToken = await getAccessToken()
//   const url = `https://fcm.googleapis.com/v1/projects/${API_CONFIG.firebase.serviceAccount.project_id}/messages:send`
//   const payload = {
//     message: {
//       token,
//       notification: userContent
//         ? {
//             title: userContent.title,
//             body: userContent.body,
//           }
//         : null,
//       data: appData,
//       android: {
//         priority: 'high',
//       },
//     },
//   }
//   await axios.post(url, payload, {
//     headers: {
//       Authorization: `Bearer ${accessToken}`,
//       'Content-Type': 'application/json',
//     },
//   })
// }

// // Test function to check Firebase credentials at server startup
// export async function testFirebaseCredentials(): Promise<void> {
//   try {
//     await getAccessToken()
//     console.log('[Firebase] Credentials verified successfully')
//   } catch (err) {
//     console.error('[Firebase] Credential check failed:', err)
//   }
// }

// export const firebaseConnector = {
//   sendPushNotification,
// }

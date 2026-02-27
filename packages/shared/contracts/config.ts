import { z } from 'zod'

export const FirebaseConfigSchema = z.object({
  apiKey: z.string(),
  appId: z.string(),
  projectId: z.string(),
  messagingSenderId: z.string(),
  storageBucket: z.string(),
  databaseURL: z.string(),
})

export type FirebaseConfig = z.infer<typeof FirebaseConfigSchema>

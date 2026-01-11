// import OpenAI from 'openai'
// import { API_CONFIG } from '@config'
// import { z } from 'zod'
// import { zodResponseFormat } from 'openai/helpers/zod'

// const findingSchema = z.object({
//   title: z.string(),
//   summary: z.string(),
// })

// async function getOpenAIClient() {
//   return new OpenAI({ apiKey: API_CONFIG.openai.apiKey })
// }

// interface OpenAIRequest {
//   prompt: string
// }

// interface OpenAIResponse {
//   summary: string
//   title: string
// }

// async function requestFinding(request: OpenAIRequest): Promise<OpenAIResponse> {
//   const prompt = `${request.prompt}`
//   const openai = await getOpenAIClient()
//   const completion = await openai.chat.completions.parse({
//     model: 'gpt-4o-mini-search-preview',
//     messages: [
//       { role: 'system', content: 'You are a web assistant.' },
//       { role: 'user', content: prompt },
//     ],
//     response_format: zodResponseFormat(findingSchema, 'finding'),
//   })

//   return {
//     title: completion.choices[0].message.parsed?.title || 'No title',
//     summary: completion.choices[0].message.parsed?.summary || 'Nothing to say? :(',
//   }
// }

// export const openAiConnector = {
//   send: requestFinding,
// }

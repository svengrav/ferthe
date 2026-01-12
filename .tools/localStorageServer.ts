/**
 * Local Storage Server
 * ---
 * This server provides a simple file-based storage system for key-value pairs.
 * It allows reading, writing, updating, and deleting data stored in JSON files.
 * It also supports CORS for specific origins.
 * 
 * ---
 * * Usage:
 * 1. Start the server: `node localStorageServer.js`
 * 2. Use the endpoints to interact with the storage:
 *    - GET /storage/:key - Read value
 *    - POST /storage/:key - Write value
 *    - PUT /storage/:key - Update value
 *    - DELETE /storage/:key - Delete value
 */

import cors from '@fastify/cors'
import Fastify from 'fastify'
import * as fs from 'fs'
import * as path from 'path'

const server = Fastify({ logger: true })

// Enable CORS for specific origins
// This allows requests from localhost:8081, localhost:3000, and localhost:19006
server.register(cors, {
  origin: ['http://localhost:8081', 'http://localhost:3000', 'http://localhost:19006'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
})

/**
  * Local Storage Server
  * This server provides a simple file-based storage system for key-value pairs.
  * It allows reading, writing, updating, and deleting data stored in JSON files.
  */
const STORAGE_DIR = path.join(process.cwd(), './_data', 'app')
console.log(`Storage directory: ${STORAGE_DIR}`)
// Ensure the storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  console.log(`Creating storage directory: ${STORAGE_DIR}`)
  fs.mkdirSync(STORAGE_DIR, { recursive: true })
}
/**
 * Helper function to get the file path for a given key.
 * It sanitizes the key to ensure it is a valid filename.
 */
function getFilePath(key: string): string {
  const sanitizedKey = key.replace(/[^a-zA-Z0-9.-_]/g, '_')
  return path.join(STORAGE_DIR, `${sanitizedKey}.json`)
}

/**
 * GET /storage/:key - Read value
 * This endpoint reads a value from a file with the given key.
 * If the file does not exist, it returns a 404 error.
 */
server.get<{ Params: { key: string } }>('/storage/:key', async (request, reply) => {
  try {
    const { key } = request.params
    const filePath = getFilePath(key)

    if (!fs.existsSync(filePath)) {
      return reply.code(404).send({ error: 'Key not found' })
    }

    const content = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(content)

    return reply.send({ success: true, data })
  } catch (error) {
    server.log.error(error)
    return reply.code(500).send({ error: 'Failed to read data' })
  }
})

/**
 * POST /storage/:key - Write value
 * This endpoint writes a value to a file with the given key.
 * If the file already exists, it will overwrite the existing data.
 */
server.post<{
  Params: { key: string },
  Body: { value: any }
}>('/storage/:key', async (request, reply) => {
  try {
    const { key } = request.params
    const { value } = request.body

    const filePath = getFilePath(key)
    const serializedValue = JSON.stringify(value, null, 2)
    fs.writeFileSync(filePath, serializedValue, 'utf-8')

    return reply.send({ success: true, message: 'Data saved' })
  } catch (error) {
    server.log.error(error)
    return reply.code(500).send({ error: 'Failed to save data' })
  }
})

/**
 * PUT /storage/:key - Update value
 * This endpoint updates the value for a given key.
 * If the key does not exist, it will create a new entry.
 */
server.delete<{ Params: { key: string } }>('/storage/:key', async (request, reply) => {
  try {
    const { key } = request.params
    const filePath = getFilePath(key)

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    return reply.send({ success: true, message: 'Data deleted' })
  } catch (error) {
    server.log.error(error)
    return reply.code(500).send({ error: 'Failed to delete data' })
  }
})

/**
 * GET /storage/:key/exists - Check if key exists
 * This endpoint checks if a key exists in the storage directory.
 */
server.get<{ Params: { key: string } }>('/storage/:key/exists', async (request, reply) => {
  try {
    const { key } = request.params
    const filePath = getFilePath(key)
    const exists = fs.existsSync(filePath)

    return reply.send({ success: true, exists })
  } catch (error) {
    server.log.error( error)
    return reply.code(500).send({ error: 'Failed to check existence' })
  }
})

/**
 * GET /storage - List all keys
 * This endpoint lists all keys stored in the storage directory.
 * It returns an array of keys (without the .json extension).
 */
server.get('/storage', async (request, reply) => {
  try {
    if (!fs.existsSync(STORAGE_DIR)) {
      return reply.send({ success: true, keys: [] })
    }

    const files = fs.readdirSync(STORAGE_DIR)
    const keys = files
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''))

    return reply.send({ success: true, keys })
  } catch (error) {
    server.log.error(error)
    return reply.code(500).send({ error: 'Failed to list keys' })
  }
})

/**
 * DELETE /storage - Remove all data
 * This endpoint clears all data in the storage directory.
 */
server.delete('/storage', async (request, reply) => {
  try {
    if (fs.existsSync(STORAGE_DIR)) {
      fs.rmSync(STORAGE_DIR, { recursive: true, force: true })
      fs.mkdirSync(STORAGE_DIR, { recursive: true })
    }

    return reply.send({ success: true, message: 'All data cleared' })
  } catch (error) {
    server.log.error(error)
    return reply.code(500).send({ error: 'Failed to clear data' })
  }
})

// Health Check
server.get('/health', async (request, reply) => {
  return reply.send({
    success: true,
    service: 'Local Storage Server',
    storage: STORAGE_DIR,
    timestamp: new Date().toISOString()
  })
})

// Start the server
const start = async () => {
  try {
    const port = 3010
    const host = '0.0.0.0'

    await server.listen({ port, host })
    server.log.info(`🗂️  Local Storage Server running on http://${host}:${port}`)
    server.log.info(`📁 Storage directory: ${STORAGE_DIR}`)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
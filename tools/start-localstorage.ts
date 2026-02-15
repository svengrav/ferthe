/**
 * Local Storage Server (Deno Native)
 * ---
 * Simple file-based key-value storage using Deno.serve()
 * 
 * Endpoints:
 * - GET /storage/:key - Read value
 * - POST /storage/:key - Write value
 * - DELETE /storage/:key - Delete value
 * - GET /storage/:key/exists - Check existence
 * - GET /storage - List all keys
 * - DELETE /storage - Clear all data
 * - GET /health - Health check
 */

const STORAGE_DIR = `${Deno.cwd()}/_data/app`
const PORT = 3010
const ALLOWED_ORIGINS = ['http://localhost:8081', 'http://localhost:3000', 'http://localhost:19006']

// Ensure storage directory exists
try {
  await Deno.mkdir(STORAGE_DIR, { recursive: true })
} catch { /* already exists */ }

const getFilePath = (key: string): string => {
  const sanitizedKey = key.replace(/[^a-zA-Z0-9.-_]/g, '_')
  return `${STORAGE_DIR}/${sanitizedKey}.json`
}

const json = (data: unknown, status = 200): Response => 
  new Response(JSON.stringify(data), { 
    status, 
    headers: { 'Content-Type': 'application/json' } 
  })

const cors = (response: Response, origin: string | null): Response => {
  const headers = new Headers(response.headers)
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin)
  }
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type')
  headers.set('Access-Control-Allow-Credentials', 'true')
  return new Response(response.body, { status: response.status, headers })
}

const fileExists = async (path: string): Promise<boolean> => {
  try {
    await Deno.stat(path)
    return true
  } catch {
    return false
  }
}

const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url)
  const origin = req.headers.get('Origin')
  const path = url.pathname

  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return cors(new Response(null, { status: 204 }), origin)
  }

  try {
    // Health Check
    if (path === '/health' && req.method === 'GET') {
      return cors(json({
        success: true,
        service: 'Local Storage Server',
        storage: STORAGE_DIR,
        timestamp: new Date().toISOString()
      }), origin)
    }

    // List all keys
    if (path === '/storage' && req.method === 'GET') {
      const keys: string[] = []
      for await (const entry of Deno.readDir(STORAGE_DIR)) {
        if (entry.isFile && entry.name.endsWith('.json')) {
          keys.push(entry.name.replace('.json', ''))
        }
      }
      return cors(json({ success: true, keys }), origin)
    }

    // Clear all data
    if (path === '/storage' && req.method === 'DELETE') {
      await Deno.remove(STORAGE_DIR, { recursive: true })
      await Deno.mkdir(STORAGE_DIR, { recursive: true })
      return cors(json({ success: true, message: 'All data cleared' }), origin)
    }

    // Route: /storage/:key or /storage/:key/exists
    const match = path.match(/^\/storage\/([^/]+)(\/exists)?$/)
    if (!match) {
      return cors(json({ error: 'Not found' }, 404), origin)
    }

    const key = match[1]
    const isExistsCheck = match[2] === '/exists'
    const filePath = getFilePath(key)

    // Check existence
    if (isExistsCheck && req.method === 'GET') {
      const exists = await fileExists(filePath)
      return cors(json({ success: true, exists }), origin)
    }

    // Read value
    if (req.method === 'GET') {
      if (!await fileExists(filePath)) {
        return cors(json({ error: 'Key not found' }, 404), origin)
      }
      const content = await Deno.readTextFile(filePath)
      const data = JSON.parse(content)
      return cors(json({ success: true, data }), origin)
    }

    // Write value
    if (req.method === 'POST') {
      const body = await req.json()
      await Deno.writeTextFile(filePath, JSON.stringify(body.value, null, 2))
      return cors(json({ success: true, message: 'Data saved' }), origin)
    }

    // Delete value
    if (req.method === 'DELETE') {
      if (await fileExists(filePath)) {
        await Deno.remove(filePath)
      }
      return cors(json({ success: true, message: 'Data deleted' }), origin)
    }

    return cors(json({ error: 'Method not allowed' }, 405), origin)
  } catch (error) {
    console.error('Error:', error)
    return cors(json({ error: 'Internal server error' }, 500), origin)
  }
}

console.log(`🗂️  Local Storage Server running on http://0.0.0.0:${PORT}`)
console.log(`📁 Storage directory: ${STORAGE_DIR}`)

Deno.serve({ port: PORT, hostname: '0.0.0.0' }, handler)

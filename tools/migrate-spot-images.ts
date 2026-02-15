/**
 * Migration script: Convert spot image URLs to blob paths
 * Run: deno run --allow-read --allow-write tools/migrate-spot-images.ts
 */

const SPOT_FILE = '_data/core/spot-collection.json'

interface OldSpot {
  id: string
  name: string
  slug: string
  description: string
  location: { lat: number; lon: number }
  options: {
    discoveryRadius: number
    clueRadius: number
    visibility?: string
  }
  image?: {
    id: string
    url: string
    previewUrl?: string
  }
  createdAt: string
  updatedAt: string
}

interface NewSpot {
  id: string
  name: string
  slug: string
  description: string
  location: { lat: number; lon: number }
  options: {
    discoveryRadius: number
    clueRadius: number
    visibility?: string
  }
  imageBlobPath?: string
  previewImageBlobPath?: string
  createdAt: string
  updatedAt: string
}

const extractBlobPath = (url: string): string => {
  try {
    const urlObj = new URL(url)
    const path = urlObj.pathname.split('/').pop() || ''
    return path
  } catch (_error) {
    throw new Error(`Invalid image URL: ${url}`)
  }
}

const migrateSpot = (oldSpot: OldSpot): NewSpot => {
  const newSpot: NewSpot = {
    id: oldSpot.id,
    name: oldSpot.name,
    slug: oldSpot.slug,
    description: oldSpot.description,
    location: oldSpot.location,
    options: oldSpot.options,
    createdAt: oldSpot.createdAt,
    updatedAt: oldSpot.updatedAt,
  }

  if (oldSpot.image?.url) {
    newSpot.imageBlobPath = extractBlobPath(oldSpot.image.url)
  }

  if (oldSpot.image?.previewUrl) {
    newSpot.previewImageBlobPath = extractBlobPath(oldSpot.image.previewUrl)
  }

  return newSpot
}

const run = async () => {
  console.log('Reading spot collection...')
  const content = await Deno.readTextFile(SPOT_FILE)
  const oldSpots: OldSpot[] = JSON.parse(content)

  console.log(`Found ${oldSpots.length} spots`)

  const newSpots = oldSpots.map(migrateSpot)

  console.log('Writing migrated spots...')
  await Deno.writeTextFile(SPOT_FILE, JSON.stringify(newSpots, null, 2))

  console.log('✅ Migration complete!')
}

run().catch(console.error)

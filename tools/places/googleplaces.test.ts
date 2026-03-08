import * as dotenv from 'dotenv'
import { createGooglePlacesConnector } from "@core/connectors/googlePlacesConnector.ts";
import { assertEquals, assertExists } from '@std/assert'
import { resolve } from "@std/path/windows/resolve";
import { fileURLToPath } from "node:url";
import { dirname } from "@std/path/windows/dirname";

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '..', '.env')
console.log(__dirname, envPath)
dotenv.config({ path: envPath })
const googlePlacesKey = Deno.env.get('GOOGLE_MAPS_API_KEY')
console.log('Using Google Maps API Key:', googlePlacesKey ? '***' : 'Not found')

Deno.test("simple test", async () => {
  const places = createGooglePlacesConnector(googlePlacesKey!)
  const result = await places.fetchPois(51.96251, 7.625188, 1000, ["historical"])
  assertExists(result)
  assertEquals(result.length, 20)
  console.log('✓ Fetched POIs:', result.map(poi => poi.name))
}); 
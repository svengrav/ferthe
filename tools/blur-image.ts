import { readFile, writeFile } from 'node:fs/promises'
import { parse, resolve } from 'node:path'
import { processImage } from '../packages/core/utils/imageProcessor.ts'

const inputPath = Deno.args[0]

if (!inputPath) {
  console.error('Usage: deno run -A blur-image.ts <image-path>')
  Deno.exit(1)
}

const fullPath = resolve(inputPath)
const { dir, name, ext } = parse(fullPath)
const outputPath = `${dir}/${name}-blur${ext}`

const imageData = await readFile(fullPath)
const base64 = `data:image/${ext.slice(1)};base64,${imageData.toString('base64')}`

const { blurred } = await processImage(base64, { blur: true })

if (!blurred) {
  console.error('❌ Failed to create blurred image')
  Deno.exit(1)
}

await writeFile(outputPath, new Uint8Array(blurred))

console.log(`✓ Blurred image saved to: ${outputPath}`)


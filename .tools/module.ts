import { execSync } from 'child_process'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

const cleanAll = (cleanNodeModules?: boolean): void => {
  const cleanDirectories = ['dist', 'build', 'coverage']
  const cleanFiles = ['*.tsbuildinfo']
  cleanNodeModules && cleanDirectories.push('node_modules')

  console.log('🧹 Cleaning all build artifacts...')
  
  // Clean directories
  cleanDirectories.forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true })
      console.log(`✅ Removed ${dir}`)
    }
  })
    // Clean build info files
  cleanFiles.forEach(pattern => {
    const files = fs.readdirSync(__dirname).filter(file => file.match(new RegExp(pattern.replace('*', '.*'))))
    files.forEach(file => {
      const filePath = path.join(__dirname, file)
      fs.rmSync(filePath)
      console.log(`✅ Removed ${filePath}`)
    })
  })
}

// Build all packages
const buildAll = (packages: string[] = ['ferthe-shared', 'ferthe-core', 'ferthe-api', 'ferthe-app']): void => {
  console.log('🚀 Starting build process...')
  console.log('📦 Build packages...')
  packages.forEach(pkg => {
    execSync(`cd ${pkg} && npm run build`, { stdio: 'inherit' })
    console.log(`✅ Built ${pkg}`)
  })
}

const startAll = (profile: string | undefined) => { 
  const envResult = dotenv.config()
  const variables = {
    ...envResult.parsed,
    NODE_ENV: profile === 'prod' ? 'production' : 'development',
    FERTHE_ENV: profile === 'prod' ? 'production' : 'development',
    DEBUG: profile === 'prod' ? '' : 'ferthe:*'
  }

  console.log('⚙️  Environment Variables:'
    , JSON.stringify(variables, null, 2)
  )

  console.log(`📋 Profile: ${profile}`)
  
  // Option 1: Storage Server in concurrently mit einbauen
  execSync('npx concurrently --names STORAGE,API,WEB --prefix-colors yellow,blue,green "npx tsx ./.tools/localStorageServer.ts" "npm run dev:api" "npm run dev:app"', {
    stdio: 'inherit',
    env: { ...process.env, ...variables }
  })
}

export { buildAll, cleanAll, startAll }


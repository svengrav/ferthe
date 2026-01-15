interface StartupArgs {
  clean?: boolean
  build?: boolean
  start?: boolean
  profile?: string
}

import * as dotenv from 'dotenv'
import { dirname, fromFileUrl, join } from "@std/path";
import * as fs from 'node:fs';
import { execSync } from 'node:child_process';

const __dirname = dirname(fromFileUrl(import.meta.url));
const rootDir = join(__dirname, '..');

const cleanAll = (cleanNodeModules?: boolean): void => {
  const cleanDirectories = ['dist', 'build', 'coverage']
  const cleanFiles = ['*.tsbuildinfo']
  cleanNodeModules && cleanDirectories.push('node_modules')

  console.log('🧹 Cleaning all build artifacts...')
  
  // Clean directories in packages
  const packages = ['packages/app', 'packages/core', 'packages/shared', 'packages/test'];
  packages.forEach(pkg => {
    const pkgPath = join(rootDir, pkg);
    cleanDirectories.forEach(dir => {
      const dirPath = join(pkgPath, dir);
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true })
        console.log(`✅ Removed ${dirPath}`)
      }
    })
    
    // Clean build info files
    cleanFiles.forEach(pattern => {
      if (fs.existsSync(pkgPath)) {
        const files = fs.readdirSync(pkgPath).filter(file => file.match(new RegExp(pattern.replace('*', '.*'))))
        files.forEach(file => {
          const filePath = join(pkgPath, file)
          fs.rmSync(filePath)
          console.log(`✅ Removed ${filePath}`)
        })
      }
    })
  })
}

// Build all packages
const buildAll = (packages: string[] = ['shared', 'core', 'app', 'test']): void => {
  console.log('🚀 Starting build process...')
  console.log('📦 Build packages...')
  packages.forEach(pkg => {
    const pkgPath = join(rootDir, 'packages', pkg);
    const pkgJsonPath = join(pkgPath, 'package.json');
    const denoJsonPath = join(pkgPath, 'deno.json');
    
    // Check if it's an npm package
    if (fs.existsSync(pkgJsonPath)) {
      const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
      if (!pkgJson.scripts?.build) {
        console.log(`⚠️  Skipping ${pkg} (no build script)`)
        return;
      }
      
      console.log(`📦 Building ${pkg} (npm)...`)
      try {
        const result = new Deno.Command('npm', {
          args: ['run', 'build'],
          cwd: pkgPath,
          stdout: 'inherit',
          stderr: 'inherit',
        }).outputSync();
        
        if (result.success) {
          console.log(`✅ Built ${pkg}`)
        } else {
          throw new Error(`Build failed for ${pkg}`)
        }
      } catch (error) {
        console.error(`❌ Failed to build ${pkg}`, error)
        throw error
      }
    } 
    // Check if it's a deno package
    else if (fs.existsSync(denoJsonPath)) {
      console.log(`⚠️  Skipping ${pkg} (deno package, no build needed)`)
    }
    else {
      console.log(`⚠️  Skipping ${pkg} (no package.json or deno.json)`)
    }
  })
}



const parseArgs = (args: string[]): StartupArgs => {
  return {
    clean: args.includes('--clean') || args.includes('-c'),
    build: args.includes('--build') || args.includes('-b'),
    start: args.includes('--start') || args.includes('-s'),
    profile: args.find(arg => arg.startsWith('--profile='))?.split('=')[1] || 'development'
  }
}

const startWithEnvironment = async (args: string[] = []): Promise<void> => {
  console.log('🚀Ferthe Development Environment...', args)
  const { start, clean, build } = parseArgs(args)

  if(clean) cleanAll();
  if(build) buildAll();
  
  if (start) {
    console.log('🌐 Starting all servers...')
    
    // Start storage server
    const storageServer = new Deno.Command('deno', {
      args: ['run', '--allow-all', './tools/localStorageServer.ts'],
      stdout: 'inherit',
      stderr: 'inherit',
    }).spawn()
    
    // Start API server
    const apiServer = new Deno.Command('deno', {
      args: ['run', '--allow-all', './packages/core/api/index.ts'],
      stdout: 'inherit',
      stderr: 'inherit',
    }).spawn()
    
    console.log('✅ Storage Server started (PID: ' + storageServer.pid + ')')
    console.log('✅ API Server started (PID: ' + apiServer.pid + ')')
    console.log('⚠️  Web app needs to be started separately with: cd packages/app && npm run web')
    
    // Wait for both processes
    await Promise.all([
      storageServer.status,
      apiServer.status
    ])
  }
}

if (import.meta.main) {
  await startWithEnvironment(Deno.args)
}
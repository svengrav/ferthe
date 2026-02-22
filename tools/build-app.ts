#!/usr/bin/env -S deno run --allow-all

/**
 * EAS Remote Build Script
 * 
 * Builds the Android app via Expo Application Services (EAS)
 * Usage: deno run --allow-all tools/build-app.ts [profile]
 */

const APP_DIR = new URL('../', import.meta.url).pathname
const WORKSPACE_ROOT = new URL('../../../', import.meta.url).pathname

// Build profile from args or default to "development"
const profile = Deno.args[0] || 'development'
const validProfiles = ['development', 'preview', 'production']

if (!validProfiles.includes(profile)) {
  console.error(`❌ Invalid profile: ${profile}`)
  console.error(`Valid profiles: ${validProfiles.join(', ')}`)
  Deno.exit(1)
}

console.log(`\n🏗️  Ferthe Android Remote Build (${profile})\n`)

// Step 1: TypeScript checks
console.log('1/4 Running TypeScript checks...')
{
  console.log('  Checking App...')
  const appCheck = await new Deno.Command('npx', {
    args: ['tsc', '--noEmit'],
    cwd: APP_DIR,
    stdout: 'inherit',
    stderr: 'inherit',
  }).output()

  if (!appCheck.success) {
    console.error('❌ TypeScript check failed for App')
    Deno.exit(1)
  }

  console.log('  Checking Core...')
  const coreCheck = await new Deno.Command('deno', {
    args: ['check'],
    cwd: `${WORKSPACE_ROOT}/packages/core`,
    stdout: 'inherit',
    stderr: 'inherit',
  }).output()

  if (!coreCheck.success) {
    console.error('❌ TypeScript check failed for Core')
    Deno.exit(1)
  }

  console.log('✅ TypeScript checks passed\n')
}

// Step 2: Update package-lock.json
console.log('2/4 Updating package-lock.json...')
{
  const updateLock = await new Deno.Command('npm', {
    args: ['install'],
    cwd: APP_DIR,
    stdout: 'inherit',
    stderr: 'inherit',
  }).output()

  if (!updateLock.success) {
    console.error('❌ Failed to update package-lock.json')
    Deno.exit(1)
  }

  console.log('✅ package-lock.json updated\n')
}

// Step 3: Check if google-services.json is committed
console.log('3/4 Checking Firebase config...')
{
  const googleServicesPath = `${APP_DIR}/google-services.json`
  try {
    await Deno.stat(googleServicesPath)
    console.log('✅ google-services.json found\n')
  } catch {
    console.error('❌ google-services.json not found')
    console.error('   Please download it from Firebase Console and place it in packages/app/')
    Deno.exit(1)
  }
}

// Step 4: Start EAS Build
console.log(`4/4 Starting EAS Build (${profile})...\n`)
{
  const build = await new Deno.Command('npx', {
    args: ['eas-cli', 'build', '--platform', 'android', '--profile', profile],
    cwd: APP_DIR,
    stdout: 'inherit',
    stderr: 'inherit',
  }).output()

  if (!build.success) {
    console.error('\n❌ Build failed')
    console.error('Check the logs at the URL shown above')
    Deno.exit(1)
  }
}

console.log('\n✅ Build complete!')
console.log('\n📋 Next steps:')
console.log('   1. Download the APK from the link above')
console.log('   2. Get SHA fingerprints: npx eas-cli credentials')
console.log('   3. Add SHA-1 and SHA-256 to Firebase Console')
console.log('   4. Install APK and test push notifications')
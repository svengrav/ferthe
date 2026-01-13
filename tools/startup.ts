import { buildAll, cleanAll, startAll } from './module.ts'

interface StartupArgs {
  clean?: boolean
  build?: boolean
  start?: boolean
  profile?: string
}

const parseArgs = (args: string[]): StartupArgs => {
  return {
    clean: args.includes('--clean') || args.includes('-c'),
    build: args.includes('--build') || args.includes('-b'),
    start: args.includes('--start') || args.includes('-s'),
    profile: args.find(arg => arg.startsWith('--profile='))?.split('=')[1] || 'development'
  }
}

// deno-lint-ignore require-await
const startWithEnvironment = async (args: string[] = []): Promise<void> => {
  console.log('🚀Ferthe Development Environment...')
  const { profile, clean, build, start } = parseArgs(args)

  console.log(`🧭 Using profile: ${profile}`)
  console.log(`⚙ -> Options - Clean: ${clean}, Build: ${build}, Start: ${start}`)
  
  console.log('🧹 Cleaned previous builds and ensured environment files are set up.')
  clean && cleanAll()
  build && buildAll()
  start && startAll(profile)
}

if (import.meta.main) {
  await startWithEnvironment(Deno.args)
}
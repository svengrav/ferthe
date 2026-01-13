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

const startWithEnvironment = async (args: string[] = []): Promise<void> => {
  console.log('🚀Ferthe Development Environment...')
  const { start } = parseArgs(args)
  
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

// Jest Configuration for ferthe-test package
//
// Key Configuration Explained:
// - rootDir: ".." sets Jest's working directory to the monorepo root
// - transform: Configures ts-jest to use ferthe-test's specific tsconfig.json for TypeScript compilation
// - moduleNameMapper: Maps path aliases (@test/*, @core/*, etc.) to actual file locations relative to rootDir
// - testMatch: Defines which files Jest should treat as test files (only in ferthe-test/src)

const config = {
  rootDir: '..',
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: '<rootDir>/ferthe-test/tsconfig.json'
    }]
  },
  moduleNameMapper: {
    '^@test/(.*)$': '<rootDir>/ferthe-test/src/$1',
    '^@app/(.*)$': '<rootDir>/ferthe-app/src/$1',
    '^@core$': '<rootDir>/ferthe-core/src/index.ts',
    '^@core/(.*)$': '<rootDir>/ferthe-core/src/$1',
    '^@shared/(.*)$': '<rootDir>/ferthe-shared/src/$1',
    '^@api/(.*)$': '<rootDir>/ferthe-api/src/$1',
  },
  testMatch: ['<rootDir>/ferthe-test/src/**/*.test.{js,ts}'],
}

export default config

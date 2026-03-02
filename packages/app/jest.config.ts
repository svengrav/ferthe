import type { Config } from 'jest'

const config: Config = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  rootDir: './',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: './tsconfig.json' }],
  },
  testMatch: ['**/__tests__/**/*.test.ts?(x)', '**/test/**/*.test.ts?(x)'],
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/../shared/$1',
  },
}

export default config

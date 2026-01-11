# Ferthe App Monorepo

A comprehensive monorepo containing the Ferthe mobile application, API server, and shared components.

## Project Structure

This monorepo contains the following packages:

- **`ferthe-app/`** - React Native mobile application built with Expo
- **`ferthe-api/`** - Fastify-based API server
- **`ferthe-core/`** - Core business logic and utilities
- **`ferthe-shared/`** - Shared types and components
- **`ferthe-test/`** - Testing utilities and configurations

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (for mobile development)

### Development

```bash
# Clean all build artifacts
npm run clean

# Install dependencies for all packages
npm install

# Build all packages
npm run build

# Start the api and app
npm run start
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Clean, build, and start all services |
| `npm run build` | Build all packages |
| `npm run clean` | Clean all build artifacts |

## Development Environment

### VS Code Setup

This project includes VS Code configuration with:
- [Ferthe VS Code Workspace](./.vscode/ferthe.code-workspace)
- Pre-configured tasks for building and running services
- Launch configurations for debugging
- Recommended extensions

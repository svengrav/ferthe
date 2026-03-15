#!/bin/bash

set -e

BUILD_VERSION=$(git rev-list --count HEAD)
ENVIRONMENT=production
PROFILE=production

echo "🚀 Starting EAS Build Deploy..."

# Check environment
echo "🏥 Running EAS doctor..."
npx expo-doctor

# Validate app config
npx expo config --type introspect

# Build for Android with production profile and auto-submit
echo "🔢 Setting BUILD_VERSION to $BUILD_VERSION"
echo "📦 Building for Android (Production)..."
eas env:create --name BUILD_VERSION --value $BUILD_VERSION --environment $ENVIRONMENT --visibility plaintext --force --non-interactive 
eas env:list --environment $ENVIRONMENT
eas build --platform android --profile $PROFILE --auto-submit

echo "✅ Deploy completed successfully!"

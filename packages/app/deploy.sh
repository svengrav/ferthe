#!/bin/bash

set -e

echo "🚀 Starting EAS Build Deploy..."

# Check environment
echo "🏥 Running EAS doctor..."
npx expo-doctor

# Validate app config
npx expo config --type introspect

# Build for Android with production profile and auto-submit
echo "📦 Building for Android (Production)..."
eas build --platform android --profile production --auto-submit

echo "✅ Deploy completed successfully!"

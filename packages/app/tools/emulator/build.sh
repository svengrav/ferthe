#!/bin/bash
set -e

echo "=== Ferthe Android Build (Docker) ==="

# setup configuration
WORKSPACE_ROOT="/root/workspace/ferthe"
APP_DIR="$WORKSPACE_ROOT/packages/app"
BUILD_DIR="$APP_DIR/tools/emulator"
IMAGE_NAME="ferthe-android-builder"
BUILD_DATE=$(date +%Y%m%d_%H%M%S)
APK_NAME="ferthe-${BUILD_DATE}.apk"

# setup build dir
mkdir -p "$BUILD_DIR"

echo "Workspace: $WORKSPACE_ROOT"
echo "App Dir: $APP_DIR"
echo "Build Dir: $BUILD_DIR"

# TypeScript check
echo ""
echo "1/6 Running TypeScript checks..."
echo "Checking App..."
cd "$APP_DIR"
npx tsc --noEmit
echo "Checking Core..."
cd "$WORKSPACE_ROOT/packages/core"
deno check
echo "✓ TypeScript checks passed"

# Check project health
echo ""
echo "2/6 Running Expo Doctor..."
cd "$APP_DIR"
npx expo-doctor
echo "✓ Expo Doctor checks passed"

# Verify EXPO token
echo ""
echo "3/6 Verifying EXPO token..."
# if [ -z "$EXPO_TOKEN" ]; then
#   echo "⚠ EXPO_TOKEN environment variable not set"
#   export EXPO_TOKEN="H5UOUgNlXLVFAsLRjsb_bamDRsvAJce7J67D5gDU"
# fi
# npx eas whoami > /dev/null 2>&1 || {
#   echo "✗ EXPO token is invalid or expired"
#   echo "Please login with: npx eas login"
#   exit 1
# }
# echo "✓ EXPO token is valid"

# build Docker image
echo ""
echo "4/6 Building Docker image..."
docker build -t "$IMAGE_NAME" -f "$BUILD_DIR/Dockerfile" "$WORKSPACE_ROOT"

# install dependencies
echo ""
echo "5/6 Installing dependencies..."
docker run --rm \
  -v "$WORKSPACE_ROOT:/workspace" \
  -w /workspace/packages/app \
  "$IMAGE_NAME" \
  bash -c "npm install"

# build Android APK
echo ""
echo "6/6 Building Android APK..."
docker run --rm \
  -v "$WORKSPACE_ROOT:/workspace" \
  -w /workspace/packages/app \
  -e EXPO_PUBLIC_ENVIRONMENT=development \
  -e EXPO_TOKEN=H5UOUgNlXLVFAsLRjsb_bamDRsvAJce7J67D5gDU \
  "$IMAGE_NAME" \
  bash -c "eas build --platform android --profile development --local --output /$APK_NAME && \
    mkdir -p /workspace/_build && cp /$APK_NAME /workspace/_build/$APK_NAME"

echo ""
echo "✓ Build complete!"

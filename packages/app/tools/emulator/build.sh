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

# build Docker image
echo ""
echo "1/3 Building Docker image..."
docker build -t "$IMAGE_NAME" -f "$APP_DIR/.docker/Dockerfile" "$WORKSPACE_ROOT"

# install dependencies
echo ""
echo "2/3 Installing dependencies..."
docker run --rm \
  -v "$WORKSPACE_ROOT:/workspace" \
  -w /workspace/packages/app \
  "$IMAGE_NAME" \
  bash -c "npm install"

# build Android APK
echo ""
echo "3/3 Building Android APK..."
docker run --rm \
  -v "$WORKSPACE_ROOT:/workspace" \
  -w /workspace/packages/app \
  -e EXPO_PUBLIC_ENVIRONMENT=development \
  -e EXPO_TOKEN=H5UOUgNlXLVFAsLRjsb_bamDRsvAJce7J67D5gDU \
  "$IMAGE_NAME" \
  bash -c "eas build --platform android --profile development --local --output $BUILD_DIR/$APK_NAME"
  # bash -c "npx expo prebuild --clean && cd android && ./gradlew assembleRelease"

echo ""
echo "✓ Build complete!"

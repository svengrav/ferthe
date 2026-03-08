# App Deployment

## Pre-Build Checklist

### 1. Code Quality & Tests
```bash
# TypeScript Check
npx tsc --noEmit

# Run tests (if available)
npm test
```

### 2. Environment Check
```bash
cd packages/app

# Check Expo environment
npx expo-doctor

# Validate app config
npx expo config --type introspect
```

### 3. Version & Credentials
```bash
# Check/increment version in app.config.ts
# buildNumber is auto-incremented (autoIncrement: true)

# Verify credentials
eas credentials
```

### 4. Preview Build (Optional but recommended)
```bash
# Build preview first for testing
eas build --platform android --profile preview

# Test on real device
# Then proceed to production
```

--- 

## Android Production Build

### Setup (one-time)
```bash
npm install -g eas-cli
eas login
```

### Production Build
```bash
cd packages/app

# Final checks
npx expo-doctor
npx tsc --noEmit

# Build for Play Store (AAB)
eas build --platform android --profile production

# Alternative: Local build
eas build --platform android --profile production --local
```

### After Build
- Download AAB from EAS Dashboard
- Upload to Google Play Console
- Internal Testing → Alpha/Beta → Production


### 

Google Play Console: https://play.google.com/console/u/0/developers/8013994114288529085?onboardingflow=signup

## Internal Test 

[Google Pla Console (Internal Test)](https://play.google.com/console/u/0/developers/8013994114288529085/app/4974251871819986515/tracks/internal-testing?releaseType=defaultReleases)
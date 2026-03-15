import { ConfigContext, ExpoConfig } from 'expo/config'
import { execSync } from 'child_process'

const isDev = process.env.EXPO_PUBLIC_ENVIRONMENT === 'development'

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: isDev ? 'ferthe dev' : 'ferthe',
  slug: 'ferthe',
  version: version({
    major: 0,
    minor: 5,
    build: getCommitCount()
  }),
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
  backgroundColor: '#121214',
  plugins: [
    "expo-asset",
    "expo-secure-store",
    [
      "expo-build-properties",
      {
        android: {
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          minSdkVersion: 24
        }
      }
    ],
    [
      "expo-image-picker",
      {
        photosPermission: "Allow ferthe to access your photos to document discoveries.",
        cameraPermission: "Allow ferthe to access your camera.",
        cameraRollPermission: "Allow ferthe to access your camera roll."
      }
    ],
    "@react-native-firebase/app",
    "@react-native-firebase/messaging",
  ],
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#121214',
  },
  ios: {
    bundleIdentifier: 'de.ferthe.app',
    // supportsTablet: true,
    // googleServicesFile: './GoogleService-Info.plist',
    entitlements: {
      'aps-environment': 'production',
    },
    infoPlist: {
      UIBackgroundModes: ['remote-notification'],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#121214',
    },
    package: isDev ? 'de.ferthe.app.dev' : 'de.ferthe.app',
    googleServicesFile: './google-services.json',
  },
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    environment: process.env.EXPO_PUBLIC_ENVIRONMENT,
    eas: {
      projectId: 'd670dc97-bc8e-47ab-9f74-58e1198b6579',
    },
  },
})

// Version helpers
const getCommitCount = (seed: number = 100) => seed + parseInt(execSync('git rev-list --count HEAD').toString().trim(), 10)
const version = (version: { major: number, minor: number, build: number }) => `${version.major}.${version.minor}.${version.build}`
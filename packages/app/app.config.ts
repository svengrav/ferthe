import { ConfigContext, ExpoConfig } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: 'ferthe',
  slug: 'ferthe',
  version: '0.0.1',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
  backgroundColor: '#12121e',
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
    ]
  ],
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#12121e',
  },
  ios: {
    bundleIdentifier: 'de.ferthe.foxhole',
    supportsTablet: true,
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
      backgroundColor: '#12121e',
    },
    package: 'de.ferthe.app',
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

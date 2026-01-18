import { ConfigContext, ExpoConfig } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: 'ferthe',
  slug: 'ferthe',
  version: '0.0.1',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
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

  ],
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#1B1C21',
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
      backgroundColor: '#1B1C21',
    },
    package: 'de.ferthe.app',
    navigationBar: {
      backgroundColor: '#1B1C21',
    },
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

# ADR

## Why specific package versions are chosen

To ensure maximum compatibility and stability across the codebase, we use only officially released and widely supported package versions. For example, React 18.2.0 is the latest stable version supported by both React Native and Expo SDK 53. Using matching versions for `react`, `react-dom`, and `@types/react` prevents type mismatches and runtime errors. This approach avoids issues caused by pre-releases or unsupported versions and ensures that all dependencies work seamlessly together in the Expo/React Native ecosystem.

The following versions should be used for best compatibility with Expo SDK 54 and React Native 0.83.1:

- react: 18.2.0
- react-dom: 18.2.0
- @types/react: 18.2.62
- expo: 54.0.31
- react-native: 0.83.1

This ensures stable builds and avoids type or runtime errors.

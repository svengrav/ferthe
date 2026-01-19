# ferthe App

# Setup

- This project uses [EXPO](https://expo.dev/) to build a React Native application for Android and iOS.
- Make sure you have the [EXPO CLI](https://docs.expo.dev/workflow/expo-cli/) installed globally: `npm install -g expo-cli`
- Install dependencies: `npm install`
- Start the development server: `npx expo start --dev-client`

## Debug
- Use VS Code Launch Cmd (Run All) to debug the Project. This works best in the web version of the app.

## Android Emulator
- For Android development, it's recommended to use an Android Emulator.
- Follow the instructions in [tools/emulator/README.md](./tools/emulator/README.md)

## Smartphone USB Debugging
- Enable USB Debugging on the smartphone.
- Connect the smartphone via USB.

```
adb devices # Show devices
adb reverse tcp:8081 tcp:8081; adb reverse tcp:3000 tcp:3000; adb reverse tcp:3010 tcp:3010; 
adb install <app>
``` 
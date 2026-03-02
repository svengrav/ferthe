# ferthe App

# Setup

```
cd /packages/app 
npm install
npx expo start --dev-client  --port 8081 -c
```

- This project uses [EXPO](https://expo.dev/) to build a React Native application for Android and iOS.
- Make sure you have the [EXPO CLI](https://docs.expo.dev/workflow/expo-cli/) installed globally: `npm install -g expo-cli`
- Install dependencies: `npm install`
- Start the development server: `npx expo start --dev-client  --port 8081 -c`

## Debug
- Use VS Code Launch Cmd (Run All) to debug the Project. This works best in the web version of the app.

## Android Emulator
- For Android development, it's recommended to use an Android Emulator.
- Follow the instructions in [tools/emulator/README.md](./tools/emulator/README.md)

## Smartphone USB Debugging 
- Enable USB / WLAN Debugging on the smartphone.
- Connect the smartphone via USB or WLAN
- Use Expo Tools "Debug Expo app..." for debugging an android app.

```
adb pair <ip>:<port> # smartphone ip and debug port (see smartphone settings)     

adb devices # Show devices
adb reverse tcp:8081 tcp:8081; adb reverse tcp:7000 tcp:7000; adb reverse tcp:7003 tcp:7003; 
adb install <app>
``` 
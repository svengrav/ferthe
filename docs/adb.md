
## Logcat for Ferthe App
adb logcat -v threadtime --pid=$(adb shell pidof de.ferthe.app) *:V
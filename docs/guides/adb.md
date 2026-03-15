# ADB Guidee

## Logcat for ferthe app
adb logcat -v threadtime --pid=$(adb shell pidof de.ferthe.app) *:V


## ADB Screenshots

```sh
# creates screenshot and pulls it in the current directory. 
# Adjust the size to your device's screen size for best results.
adb shell wm size 1440x2960
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png
adb shell wm size reset
```
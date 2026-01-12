import { Platform } from 'react-native'

export const executePlatformSpecific = (webFn: (() => void)[] = [], nativeFn: (() => void)[] = []) => {
  if (Platform.OS === 'web') {
    webFn.forEach(fn => fn())
  } else {
    nativeFn.forEach(fn => fn())
  }
}

export const execOnWeb = (webFn: (() => void)[]) => {
  if (Platform.OS === 'web') {
    webFn.forEach(fn => fn())
  }
}

export const execOnNative = (nativeFn: (() => void)[]) => {
  if (Platform.OS !== 'web') {
    nativeFn.forEach(fn => fn())
  }
}

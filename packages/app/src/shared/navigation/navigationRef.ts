import { createNavigationContainerRef } from '@react-navigation/native'

export const navigationRef = createNavigationContainerRef<any>()

export const appNavigator = {
  toTrails: () => navigationRef.current?.navigate('Trails'),
  toFindings: () => navigationRef.current?.navigate('Feed'),
  toAbout: () => navigationRef.current?.navigate('About'),
  toAccount: () => navigationRef.current?.navigate('Account'),
}

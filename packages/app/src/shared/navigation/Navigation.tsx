import AboutScreen from '@app/features/about/AboutScreen'
import CommunityScreen from '@app/features/community/components/CommunityScreen'
import MapScreen from '@app/features/map/components/MapScreen'
import SpotScreen from '@app/features/spot/components/SpotScreen'
import TrailScreen from '@app/features/trail/components/TrailScreen'
import { Icon } from '@app/shared/components'
import { useLocalization } from '@app/shared/localization/'
import { Theme, useTheme } from '@app/shared/theme'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { NavigationContainer } from '@react-navigation/native'
import { StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useOverlayStore } from '../overlay/useOverlayStore'
import { CardIcon, FoxIcon } from './NavigationIcons'
import { navigationRef } from './navigationRef'

const Tab = createBottomTabNavigator()

const TAB_LABEL_FONT_SIZE = 11

export type RootParamList = {
  Trails: undefined
  Spots: undefined
  Map: undefined
  Socials: undefined
  Dev: undefined
}

/**
 * Main navigation component with bottom tab navigator.
 * Handles routing between main app screens and clears overlays on navigation.
 */
export function Navigation() {
  const { styles, theme } = useTheme(createStyles)
  const { locales } = useLocalization()
  const clearAll = useOverlayStore(s => s.clearAll)
  const insets = useSafeAreaInsets()

  const handleStateChange = () => {
    clearAll()
  }

  const tabBarStyle = {
    ...styles.tabBar,
    height: theme.dimensions.NAV_HEIGHT + insets.bottom,
    paddingBottom: insets.bottom,
  }

  return (
    <NavigationContainer ref={navigationRef} onStateChange={handleStateChange}>
      <Tab.Navigator
        id={undefined}
        initialRouteName='Map'
        screenOptions={{
          tabBarStyle,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.disabled,
          tabBarShowLabel: true,
          tabBarLabelPosition: 'below-icon',
          tabBarLabelStyle: styles.tabBarLabel,
        }}>
        <Tab.Screen
          name='Trails'
          component={TrailScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Icon name='line-axis' color={color} size='md' />,
            headerShown: false,
            title: locales.navigation.trails,
          }}
        />
        <Tab.Screen
          name='Spots'
          component={SpotScreen}
          options={{
            tabBarIcon: ({ color, size }) => <CardIcon color={color} size={size} />,
            headerShown: false,
            title: locales.navigation.feed,
          }}
        />
        <Tab.Screen
          name='Map'
          component={MapScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Icon name='compass' color={color} size='md' />,
            headerShown: false,
            title: locales.navigation.map,
          }}
        />
        <Tab.Screen
          name='Socials'
          component={CommunityScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Icon name='people' color={color} size='md' />,
            headerShown: false,
            title: locales.navigation.socials,
          }}
        />
        <Tab.Screen
          name='About'
          component={AboutScreen}
          options={{
            tabBarIcon: ({ color, size }) => <FoxIcon color={color} size={size} />,
            headerShown: false,
            title: locales.navigation.about,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  tabBar: {
    backgroundColor: theme.colors.background,
    elevation: 0,
    borderColor: theme.colors.divider,
  },
  tabBarLabel: {
    fontSize: TAB_LABEL_FONT_SIZE,
    fontWeight: '500',
  },
})

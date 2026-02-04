import AboutScreen from '@app/features/about/AboutScreen'
import CommunityScreen from '@app/features/community/components/CommunityScreen'
import DiscoveryScreen from '@app/features/discovery/components/DiscoveryScreen'
import MapScreen from '@app/features/map/components/MapScreen'
import TrailScreen from '@app/features/trail/components/TrailScreen'
import { Icon } from '@app/shared/components'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import useThemeStore from '@app/shared/theme/themeStore'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { NavigationContainer } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useOverlayStore } from '../overlay/useOverlayStore'
import { CardIcon, TreeIcon } from './NavigationIcons'
import { navigationRef } from './navigationRef'

const Tab = createBottomTabNavigator()

export type RootParamList = {
  Trails: undefined
  Discoveries: { discoveryId?: string }
  Map: undefined
  Socials: undefined
  Dev: undefined
}

export function Navigation() {
  const { colors, dimensions } = useThemeStore()
  const { t } = useLocalizationStore()
  const clearAll = useOverlayStore((s) => s.clearAll)
  const insets = useSafeAreaInsets()

  return (
    <NavigationContainer ref={navigationRef} onStateChange={() => {
      // Clear all overlays when navigating to a new screen
      clearAll()
    }}>
      <Tab.Navigator
        id={undefined}
        initialRouteName='Map'
        screenOptions={{
          tabBarStyle: {
            height: dimensions.NAV_HEIGHT + insets.bottom,
            paddingBottom: insets.bottom,
            backgroundColor: colors.background,
            elevation: 0,
            shadowOpacity: 0,
            borderColor: colors.divider,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.disabled,
          tabBarShowLabel: true,
          tabBarLabelPosition: 'below-icon',
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
          },
        }}>
        <Tab.Screen
          name='Trails'
          component={TrailScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Icon name='line-axis' color={color} size={size} />,
            headerShown: false,
            title: t.navigation.trails,
          }}
        />
        <Tab.Screen
          name='Discoveries'
          component={DiscoveryScreen}
          options={{
            tabBarIcon: ({ color, size }) => <CardIcon color={color} size={size} />,
            headerShown: false,
            title: t.navigation.feed,
          }}
        />
        <Tab.Screen
          name='Map'
          component={MapScreen}
          options={{
            tabBarIcon: ({ color, size }) => <TreeIcon color={color} size={size} />,
            headerShown: false,
          }}
        />
        <Tab.Screen
          name='Socials'
          component={CommunityScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Icon name='people' color={color} size={size} />,
            headerShown: false,
            title: t.navigation.socials,
          }}
        />
        <Tab.Screen
          name='About'
          component={AboutScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Icon name='device-hub' color={color} size={size} />,
            headerShown: false,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  )
}

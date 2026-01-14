import DevScreen from '@app/dev/components/DevScreen'
import AccountScreen from '@app/features/account/components/AccountScreen'
import DiscoveryScreen from '@app/features/discovery/components/DiscoveryScreen'
import MapScreen from '@app/features/map/components/MapScreen'
import TrailScreen from '@app/features/trail/components/TrailScreen'
import { Icon } from '@app/shared/components'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import useThemeStore from '@app/shared/theme/useThemeStore'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { NavigationContainer } from '@react-navigation/native'
import { useOverlayStore } from '../overlay/useOverlayStore'
import { CardIcon, TreeIcon } from './NavigationIcons'
import { navigationRef } from './navigationRef'

const Tab = createBottomTabNavigator()

export function Navigation() {
  const { colors, constants } = useThemeStore()
  const { t } = useLocalizationStore()
  const clearAll = useOverlayStore((s) => s.clearAll)

  return (
    <NavigationContainer ref={navigationRef} onStateChange={() => {
      // Clear all overlays when navigating to a new screen
      clearAll()
    }}>
      <Tab.Navigator
        id={undefined}
        screenOptions={{
          tabBarStyle: {
            height: constants.NAV_HEIGHT,
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
            tabBarIcon: ({ color, size }) => <TreeIcon color={color} />,
            headerShown: false,
          }}
        />
        <Tab.Screen
          name='Account'
          component={AccountScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Icon name='account-circle' color={color} size={size} />,
            headerShown: false,
            title: t.navigation.account,
          }}
        />
        {/* <Tab.Screen
          name='About'
          component={AboutScreen}
          options={{
            tabBarIcon: ({ color, size }) => <FoxIcon color={color} />,
            headerShown: false,
            title: t.navigation.about,
          }}
        /> */}
        {__DEV__ && (
          <Tab.Screen
            name='Dev'
            component={DevScreen}
            options={{
              tabBarIcon: ({ color, size }) => <Icon name='device-hub' color={color} />,
              headerShown: false,
            }}
          />
        )}
      </Tab.Navigator>
    </NavigationContainer>
  )
}

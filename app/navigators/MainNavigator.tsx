import { createNativeStackNavigator } from '@react-navigation/native-stack'
import * as Screens from '@/screens'
import { useAppTheme } from '@/utils/useAppTheme'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { ThemedStyle } from '@/theme'
import type { CompositeScreenProps } from '@react-navigation/native'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import type { AppStackParamList, AppStackScreenProps } from './AppNavigator'
import type { TextStyle, ViewStyle } from 'react-native'
import { translate } from '../i18n'
import { Icon } from '../components'
import Feather from '@expo/vector-icons/Feather'

export interface MainNavigatorParamList {
  [key: string]: undefined | object
  Map: undefined
  Scoreboard: undefined
  Rewards: undefined
  Settings: undefined
}

// export type MainNavigatorScreenProps<T extends keyof MainNavigatorParamList> = CompositeScreenProps<
//   BottomTabScreenProps<MainNavigatorParamList, T>,
//   AppStackScreenProps<keyof AppStackParamList>
// >

// const Stack = createNativeStackNavigator<MainNavigatorParamList>()

const Tab = createBottomTabNavigator<MainNavigatorParamList>()

export function MainNavigator() {
  const { bottom } = useSafeAreaInsets()
  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: themed([$tabBar, { height: bottom + 60 }]),
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.text,
        tabBarLabelStyle: themed($tabBarLabel),
        tabBarItemStyle: themed($tabBarItem),
      }}
    >
      <Tab.Screen
        name="Map"
        component={Screens.MapScreen}
        options={{
          tabBarLabel: 'Map',
          tabBarIcon: ({ focused }) => (
            <Feather name="map" size={24} color={focused ? colors.tint : colors.tintInactive} />
          ),
        }}
      />

      <Tab.Screen
        name="Rewards"
        component={Screens.RewardsScreen}
        options={{
          tabBarLabel: 'Rewards',
          tabBarIcon: ({ focused }) => (
            <Icon icon="bell" color={focused ? colors.tint : colors.tintInactive} size={24} />
          ),
        }}
      />

      <Tab.Screen
        name="Scoreboard"
        component={Screens.ScoreboardScreen}
        options={{
          tabBarLabel: 'Scoreboard',
          tabBarIcon: ({ focused }) => (
            <Icon icon="view" color={focused ? colors.tint : colors.tintInactive} size={24} />
          ),
        }}
      />

      <Tab.Screen
        name="Settings"
        component={Screens.SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused }) => (
            <Icon icon="settings" color={focused ? colors.tint : colors.tintInactive} size={24} />
          ),
        }}
      />
    </Tab.Navigator>
  )
}

const $tabBar: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
  borderTopColor: colors.transparent,
})

const $tabBarItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingTop: spacing.xxs,
})

const $tabBarLabel: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontSize: 12,
  fontFamily: typography.primary.medium,
  lineHeight: 16,
  color: colors.text,
})

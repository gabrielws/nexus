import * as Screens from '@/screens'
import { useAppTheme } from '@/utils/useAppTheme'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { ThemedStyle } from '@/theme'
import { createBottomTabNavigator, SceneStyleInterpolators, TransitionSpecs } from '@react-navigation/bottom-tabs'
import type { TextStyle, ViewStyle } from 'react-native'

import { Icon } from '../components'
import Feather from '@expo/vector-icons/Feather'

export interface MainNavigatorParamList {
  [key: string]: undefined | object
  Map: undefined
  Scoreboard: undefined
  Rewards: undefined
  Profile: undefined
}

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
      backBehavior="initialRoute"
    >
      <Tab.Screen
        name="Map"
        component={Screens.MapScreen}
        options={{
          tabBarLabel: 'Map',
          transitionSpec: TransitionSpecs.ShiftSpec,
          sceneStyleInterpolator: SceneStyleInterpolators.forShift,
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
          transitionSpec: TransitionSpecs.ShiftSpec,
          sceneStyleInterpolator: SceneStyleInterpolators.forShift,
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
          transitionSpec: TransitionSpecs.ShiftSpec,
          sceneStyleInterpolator: SceneStyleInterpolators.forShift,
          tabBarIcon: ({ focused }) => (
            <Icon icon="view" color={focused ? colors.tint : colors.tintInactive} size={24} />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={Screens.ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          transitionSpec: TransitionSpecs.ShiftSpec,
          sceneStyleInterpolator: SceneStyleInterpolators.forShift,
          tabBarIcon: ({ focused }) => (
            <Icon icon="user" color={focused ? colors.tint : colors.tintInactive} size={24} />
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

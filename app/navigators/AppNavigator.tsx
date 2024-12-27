/**
 * The app navigator (formerly "AppNavigator" and "MainNavigator") is used for the primary
 * navigation flows of your app.
 * Generally speaking, it will contain an auth flow (registration, login, forgot password)
 * and a "main" flow which the user will use once logged in.
 */
import { NavigationContainer } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { observer } from 'mobx-react-lite'
import * as Screens from '@/screens'
import Config from '../config'
import { navigationRef, useBackButtonHandler } from './navigationUtilities'
import { useAppTheme, useThemeProvider } from '@/utils/useAppTheme'
import type { ComponentProps } from 'react'
import { useStores } from '../models'
import { useAuth } from '@/services/auth/useAuth'
import React from 'react'
import { MainNavigator } from './MainNavigator'
import { ActivityIndicator, View } from 'react-native'

/**
 * This type allows TypeScript to know what routes are defined in this navigator
 * as well as what properties (if any) they might take when navigating to them.
 *
 * If no params are allowed, pass through `undefined`. Generally speaking, we
 * recommend using your MobX-State-Tree store(s) to keep application state
 * rather than passing state through navigation params.
 *
 * For more information, see this documentation:
 *   https://reactnavigation.org/docs/params/
 *   https://reactnavigation.org/docs/typescript#type-checking-the-navigator
 *   https://reactnavigation.org/docs/typescript/#organizing-types
 */
export interface AppStackParamList {
  [key: string]: undefined | object
  Map: undefined
  Welcome: undefined
  Settings: undefined
  Scoreboard: undefined
  Rewards: undefined
  SignIn: undefined
  Main: undefined
  Permission: undefined
  // IGNITE_GENERATOR_ANCHOR_APP_STACK_PARAM_LIST
}

/**
 * This is a list of all the route names that will exit the app if the back button
 * is pressed while in that screen. Only affects Android.
 */
const exitRoutes = Config.exitRoutes

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  )
}

export type AppStackScreenProps<T extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  T
>

// Documentation: https://reactnavigation.org/docs/stack-navigator/
const Stack = createNativeStackNavigator<AppStackParamList>()

const AppStack = observer(() => {
  const { isAuthenticated, isLoading } = useAuth()
  const { locationStore } = useStores()

  const {
    theme: { colors },
  } = useAppTheme()

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        navigationBarColor: colors.background,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      {isAuthenticated
        ? (
            locationStore.hasLocationPermission
              ? (
                  <>
                    <Stack.Screen name="Main" component={MainNavigator} />
                    {/* IGNITE_GENERATOR_ANCHOR_APP_STACK_SCREENS */}
                  </>
                )
              : (
                  <Stack.Screen name="Permission" component={Screens.PermissionScreen} />
                )
          )
        : (
            <Stack.Screen
              name="SignIn"
              component={Screens.SignInScreen}
              options={{ animationTypeForReplace: 'pop' }}
            />
          )}
    </Stack.Navigator>
  )
})

export interface NavigationProps extends Partial<ComponentProps<typeof NavigationContainer>> {}

export const AppNavigator = observer((props: NavigationProps) => {
  const { themeScheme, navigationTheme, setThemeContextOverride, ThemeProvider }
    = useThemeProvider()

  useBackButtonHandler(routeName => exitRoutes.includes(routeName))

  return (
    <ThemeProvider value={{ themeScheme, setThemeContextOverride }}>
      <NavigationContainer ref={navigationRef as any} theme={navigationTheme} {...props}>
        <AppStack />
      </NavigationContainer>
    </ThemeProvider>
  )
})

import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator, NativeStackScreenProps } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { observer } from "mobx-react-lite"
import * as Screens from "@/screens"
import Config from "../config"
import { navigationRef, useBackButtonHandler } from "./navigationUtilities"
import { useAppTheme, useThemeProvider } from "@/utils/useAppTheme"
import { ComponentProps } from "react"
import { AuthNavigator } from "./AuthNavigator"
import { useAuth } from "app/services/auth/useAuth"
import Entypo from "@expo/vector-icons/Entypo"
import FontAwesome6 from "@expo/vector-icons/FontAwesome6"
import Feather from "@expo/vector-icons/Feather"
import { ActivityIndicator, View, ViewStyle } from "react-native"

export type AppStackParamList = {
  Welcome: undefined
  AuthStack: undefined
  Main: undefined
  Settings: undefined
  Debug: undefined
  Rewards: undefined
  Scoreboard: undefined
  Map: undefined
  Profile: undefined
  EditUser: undefined
  ChangePassword: undefined
  ChangeEmail: undefined
  Language: undefined
  ViewProfile: { userId: string }
}

const exitRoutes = Config.exitRoutes

export type AppStackScreenProps<T extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  T
>

const Stack = createNativeStackNavigator<AppStackParamList>()
const Tab = createBottomTabNavigator()

const AppStack = observer(function AppStack() {
  const { isAuthenticated, isLoading } = useAuth()

  const {
    theme: { colors },
  } = useAppTheme()

  const screenOptions = {
    headerShown: false,
    navigationBarColor: colors.background,
    contentStyle: {
      backgroundColor: colors.background,
    },
  }

  const $loadingContainer: ViewStyle = {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  }

  if (isLoading) {
    return (
      <View style={$loadingContainer}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    )
  }

  if (!isAuthenticated) {
    return (
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen
          name="AuthStack"
          component={AuthNavigator}
          options={{ animationTypeForReplace: "pop" }}
        />
      </Stack.Navigator>
    )
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="Settings" component={Screens.SettingsScreen} />
      <Stack.Screen name="EditUser" component={Screens.EditUserScreen} />
      <Stack.Screen name="ChangePassword" component={Screens.ChangePasswordScreen} />
      <Stack.Screen name="ChangeEmail" component={Screens.ChangeEmailScreen} />
      <Stack.Screen name="ViewProfile" component={Screens.ViewProfileScreen} />
      <Stack.Screen
        name="Language"
        component={Screens.LanguageScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  )
})

const TabNavigator = () => {
  const {
    theme: { colors },
  } = useAppTheme()

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: colors.background,
        },
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.text,
        tabBarStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Tab.Screen
        name="Map"
        component={Screens.MapScreen as any}
        options={{
          title: "Mapa",
          tabBarIcon: ({ color, size }) => <Entypo name="map" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Rewards"
        component={Screens.RewardsScreen as any}
        options={{
          title: "Recompensas",
          tabBarIcon: ({ color, size }) => <Entypo name="price-ribbon" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Scoreboard"
        component={Screens.ScoreboardScreen as any}
        options={{
          title: "Scoreboard",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6 name="ranking-star" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={Screens.ProfileScreen as any}
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} />,
        }}
      />
      {/* <Tab.Screen
        name="Debug"
        component={Screens.DebugScreen as any}
        options={{
          title: "Debug",
          tabBarIcon: ({ color, size }) => <Icon icon="settings" size={size} color={color} />,
        }}
      /> */}
    </Tab.Navigator>
  )
}

export interface NavigationProps extends Partial<ComponentProps<typeof NavigationContainer>> {}

export const AppNavigator = observer(function AppNavigator(props: NavigationProps) {
  const { themeScheme, navigationTheme, setThemeContextOverride, ThemeProvider } =
    useThemeProvider()

  useBackButtonHandler((routeName) => exitRoutes.includes(routeName))

  return (
    <ThemeProvider value={{ themeScheme, setThemeContextOverride }}>
      <NavigationContainer ref={navigationRef} theme={navigationTheme} {...props}>
        <AppStack />
      </NavigationContainer>
    </ThemeProvider>
  )
})

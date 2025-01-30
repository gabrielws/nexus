import { createNativeStackNavigator, NativeStackScreenProps } from "@react-navigation/native-stack"
import { observer } from "mobx-react-lite"
import { SignInScreen } from "@/screens"

export type AuthStackParamList = {
  Signin: undefined
  Signup: undefined
}

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>

const Stack = createNativeStackNavigator<AuthStackParamList>()

export const AuthNavigator = observer(function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Signin" component={SignInScreen} />
      {/* <Stack.Screen name="Signup" component={SignUpScreen} /> */}
    </Stack.Navigator>
  )
})

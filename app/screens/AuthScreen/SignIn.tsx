import { ComponentType, FC, useMemo, useRef, useState } from "react"
import { observer } from "mobx-react-lite"
import { Image, ImageStyle, Pressable, TextInput, TextStyle, View, ViewStyle } from "react-native"
import { AuthStackScreenProps } from "app/navigators"
import { Button, Icon, Screen, Text, TextField, TextFieldAccessoryProps } from "app/components"
import { useSafeAreaInsetsStyle } from "app/utils/useSafeAreaInsetsStyle"
import { colors, spacing } from "app/theme"
import { useAuth } from "app/services/auth/useAuth"

const logo = require("../../../assets/images/logo.png")

interface SignInScreenProps extends AuthStackScreenProps<"Signin"> {}

export const SignInScreen: FC<SignInScreenProps> = observer(function SignInScreen() {
  const $bottomContainerInsets = useSafeAreaInsetsStyle(["bottom"])
  const { signIn, signUp } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [isSigningUp, setIsSigningUp] = useState(false)
  const isLoading = isSigningIn || isSigningUp
  const [error, setError] = useState<string | undefined>(undefined)
  const [validationErrors, setValidationErrors] = useState<Map<string, string>>(new Map())
  const passwordInput = useRef<TextInput>(null)
  const [isPasswordHidden, setIsPasswordHidden] = useState(true)

  const PasswordRightAccessory: ComponentType<TextFieldAccessoryProps> = useMemo(
    () =>
      function PasswordRightAccessory(props: TextFieldAccessoryProps) {
        return (
          <Icon
            icon={isPasswordHidden ? "view" : "hidden"}
            color={colors.palette.neutral800}
            containerStyle={props.style}
            size={20}
            onPress={() => setIsPasswordHidden(!isPasswordHidden)}
          />
        )
      },
    [isPasswordHidden],
  )

  const validateForm = () => {
    const errors: Map<string, string> = new Map()

    if (!email || email.split("@").length !== 2) {
      errors.set("Email", "must be valid email")
    }

    if (!password) {
      errors.set("Password", "cannot be blank")
    }

    return errors
  }

  const onSignIn = async () => {
    try {
      setIsSigningIn(true)
      setError(undefined)

      const errors = validateForm()
      setValidationErrors(errors)
      if (errors.size > 0) return

      const { error } = await signIn({ email, password })
      if (error) {
        setError(error.message)
      }
    } finally {
      setIsSigningIn(false)
    }
  }

  const onSignUp = async () => {
    try {
      setIsSigningUp(true)
      setError(undefined)

      const errors = validateForm()
      setValidationErrors(errors)
      if (errors.size > 0) return

      const { error } = await signUp({ email, password })
      if (error) {
        setError(error.message)
      }
    } finally {
      setIsSigningUp(false)
    }
  }

  const onForgotPassword = () => {
    // Forgot Password Flow
    console.log("Forgot Password Flow")
  }

  return (
    <Screen contentContainerStyle={$root} preset="auto" safeAreaEdges={["top"]}>
      <View style={$container}>
        <View style={$topContainer}>
          <Image style={$logo} source={logo} resizeMode="contain" />
        </View>
        <View style={[$bottomContainer, $bottomContainerInsets]}>
          {error && <Text style={$errorText}>{error}</Text>}
          <View>
            <TextField
              containerStyle={$textField}
              label="Email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              inputMode="email"
              defaultValue={email}
              onChangeText={setEmail}
              readOnly={isLoading}
              returnKeyType="next"
              onSubmitEditing={() => passwordInput.current?.focus()}
              helper={validationErrors.get("Email")}
              status={validationErrors.get("Email") ? "error" : undefined}
            />
            <TextField
              containerStyle={$textField}
              label="Password"
              autoCapitalize="none"
              defaultValue={password}
              autoComplete="current-password"
              autoCorrect={false}
              onChangeText={setPassword}
              onSubmitEditing={onSignIn}
              returnKeyType="done"
              readOnly={isLoading}
              RightAccessory={PasswordRightAccessory}
              secureTextEntry={isPasswordHidden}
              helper={validationErrors.get("Password")}
              status={validationErrors.get("Password") ? "error" : undefined}
            />
          </View>
          <View>
            <Button onPress={onSignIn} disabled={isLoading}>
              {isSigningIn ? "Signing In..." : "Sign In"}
            </Button>
            <Pressable style={$forgotPassword} onPress={onForgotPassword} disabled={isLoading}>
              <Text preset="bold">Forgot Password?</Text>
            </Pressable>
            <Text style={$buttonDivider}>- or -</Text>
            <Button preset="reversed" onPress={onSignUp} disabled={isLoading}>
              {isSigningUp ? "Signing Up..." : "Sign Up"}
            </Button>
          </View>
          <View style={$cap} />
        </View>
      </View>
    </Screen>
  )
})

const $root: ViewStyle = {
  minHeight: "100%",
  backgroundColor: colors.palette.neutral100,
}

const $container: ViewStyle = {
  backgroundColor: colors.background,
}

const $topContainer: ViewStyle = {
  height: 200,
  justifyContent: "center",
  alignItems: "center",
}

const $bottomContainer: ViewStyle = {
  backgroundColor: colors.palette.neutral100,
  paddingBottom: spacing.xl,
  paddingHorizontal: spacing.lg,
}

const $cap: ViewStyle = {
  backgroundColor: colors.palette.neutral100,
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  height: spacing.xl,
  position: "absolute",
  top: -spacing.xl,
  left: 0,
  right: 0,
}

const $textField: ViewStyle = {
  marginBottom: spacing.md,
}

const $forgotPassword: ViewStyle = {
  marginVertical: spacing.md,
}

const $buttonDivider: TextStyle = {
  textAlign: "center",
  marginVertical: spacing.md,
}

const $logo: ImageStyle = {
  height: 88,
  width: "100%",
  marginBottom: spacing.xxl,
}

const $errorText: TextStyle = {
  color: colors.error,
}

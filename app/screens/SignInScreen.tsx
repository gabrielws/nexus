import type { TextFieldAccessoryProps } from '@/components'
import type { AppStackScreenProps } from '@/navigators'
import type { ComponentType, FC } from 'react'
import type { ImageStyle, TextInput, TextStyle, ViewStyle } from 'react-native'
import { Button, Icon, Screen, Text, TextField } from '@/components'
import { useAuth } from '@/services/auth/useAuth'
import { colors, spacing } from '@/theme'
import { useSafeAreaInsetsStyle } from '@/utils/useSafeAreaInsetsStyle'
import { observer } from 'mobx-react-lite'
import React, { useMemo, useRef, useState } from 'react'
import { Image, Pressable, View } from 'react-native'
import Toast from 'react-native-toast-message'

const logo = require('../../assets/images/logo.png')

interface SignInScreenProps extends AppStackScreenProps<'SignIn'> {}

interface PasswordRightAccessoryProps extends TextFieldAccessoryProps {
  isPasswordHidden: boolean
  onTogglePasswordHidden: () => void
}

type ValidationErrors = Map<'Email' | 'Password', string>

const EMAIL_REGEX = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/

const PasswordRightAccessory: ComponentType<PasswordRightAccessoryProps> = ({
  style,
  isPasswordHidden,
  onTogglePasswordHidden,
}) => {
  return (
    <Icon
      icon={isPasswordHidden ? 'view' : 'hidden'}
      color={colors.palette.neutral800}
      containerStyle={style as ViewStyle}
      size={20}
      onPress={onTogglePasswordHidden}
    />
  )
}

export const SignInScreen: FC<SignInScreenProps> = observer(({ navigation }) => {
  const $bottomContainerInsets = useSafeAreaInsetsStyle(['bottom'])
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [isPasswordHidden, setIsPasswordHidden] = useState(true)
  const [password, setPassword] = useState('')
  const [isSigningIn, setIsSigningIn] = useState(false)
  const passwordInput = useRef<TextInput>(null)
  const [error, setError] = useState<string | undefined>(undefined)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(new Map())

  const validateForm = () => {
    const errors: ValidationErrors = new Map()

    if (!email || !EMAIL_REGEX.test(email))
      errors.set('Email', 'Email deve ser válido')

    if (!password)
      errors.set('Password', 'Senha não pode ser vazia')

    return errors
  }

  const PasswordAccessory = useMemo(
    () => (props: TextFieldAccessoryProps) => (
      <PasswordRightAccessory
        {...props}
        isPasswordHidden={isPasswordHidden}
        onTogglePasswordHidden={() => setIsPasswordHidden(!isPasswordHidden)}
      />
    ),
    [isPasswordHidden],
  )

  const onSignIn = async () => {
    try {
      setIsSigningIn(true)
      setError(undefined)
      setValidationErrors(new Map())

      const errors = validateForm()
      setValidationErrors(errors)
      if (errors.size > 0)
        return

      await signIn({ email, password })
    }
    catch (e: unknown) {
      if (__DEV__)
        console.error('Erro durante login:', e)

      const isAuthError = e && typeof e === 'object' && 'message' in e
        ? e.message === 'Invalid login credentials'
        : false

      Toast.show({
        type: 'error',
        text1: 'Erro ao fazer login',
        text2: isAuthError
          ? 'Email ou senha incorretos'
          : 'Ocorreu um erro ao tentar fazer login',
        topOffset: 50,
        visibilityTime: 3000,
        autoHide: true,
      })
    }
    finally {
      setIsSigningIn(false)
    }
  }

  const onForgotPassword = () => {
    // Forgot Password Flow
    console.warn('Forgot Password Flow')
  }

  return (
    <Screen contentContainerStyle={$root} preset="auto" safeAreaEdges={['top']}>
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
              defaultValue={email}
              onChangeText={setEmail}
              readOnly={isSigningIn}
              onSubmitEditing={() => passwordInput.current?.focus()}
              returnKeyType="next"
              inputMode="email"
              helper={validationErrors.get('Email')}
              status={validationErrors.get('Email') ? 'error' : undefined}
            />
            <TextField
              ref={passwordInput}
              containerStyle={$textField}
              label="Password"
              autoCapitalize="none"
              autoComplete="current-password"
              autoCorrect={false}
              defaultValue={password}
              onSubmitEditing={onSignIn}
              returnKeyType="done"
              secureTextEntry={isPasswordHidden}
              onChangeText={setPassword}
              RightAccessory={PasswordAccessory}
              readOnly={isSigningIn}
              helper={validationErrors.get('Password')}
              status={validationErrors.get('Password') ? 'error' : undefined}
            />
          </View>
          <View>
            <Button
              onPress={onSignIn}
              disabled={isSigningIn}
            >
              {isSigningIn ? 'Entrando...' : 'Entrar'}
            </Button>
            <Pressable style={$forgotPassword} onPress={onForgotPassword} disabled={isSigningIn}>
              <Text preset="bold">Esqueceu a senha?</Text>
            </Pressable>
            <Text style={$buttonDivider}>- ou -</Text>
            <Button
              preset="reversed"
              onPress={() => navigation.navigate('SignUp')}
              disabled={isSigningIn}
            >
              Criar conta
            </Button>
          </View>
          <View style={$cap} />
        </View>
      </View>
    </Screen>
  )
})

const $root: ViewStyle = {
  minHeight: '100%',
  backgroundColor: colors.palette.neutral100,
}

const $container: ViewStyle = {
  backgroundColor: colors.background,
}

const $topContainer: ViewStyle = {
  height: 200,
  justifyContent: 'center',
  alignItems: 'center',
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
  position: 'absolute',
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
  textAlign: 'center',
  marginVertical: spacing.md,
}

const $logo: ImageStyle = {
  height: 88,
  width: '100%',
  marginBottom: spacing.xxl,
}

const $errorText: TextStyle = {
  color: colors.error,
}

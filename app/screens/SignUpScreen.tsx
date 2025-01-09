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
import { Image, View } from 'react-native'
import Toast from 'react-native-toast-message'

const logo = require('../../assets/images/logo.png')

interface SignUpScreenProps extends AppStackScreenProps<'SignUp'> {}

interface PasswordRightAccessoryProps extends TextFieldAccessoryProps {
  isPasswordHidden: boolean
  onTogglePasswordHidden: () => void
}

type ValidationErrors = Map<'Email' | 'Password' | 'Username', string>

const EMAIL_REGEX = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
const USERNAME_REGEX = /^[\w-]{3,}$/

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

export const SignUpScreen: FC<SignUpScreenProps> = observer(({ navigation }) => {
  const $bottomContainerInsets = useSafeAreaInsetsStyle(['bottom'])
  const { signUp } = useAuth()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isPasswordHidden, setIsPasswordHidden] = useState(true)
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(new Map())

  const emailInput = useRef<TextInput>(null)
  const passwordInput = useRef<TextInput>(null)

  const validateForm = () => {
    const errors: ValidationErrors = new Map()

    if (!username || !USERNAME_REGEX.test(username))
      errors.set('Username', 'Nome de usuário deve conter apenas letras, números, - e _')

    if (!email || !EMAIL_REGEX.test(email))
      errors.set('Email', 'Email deve ser válido')

    if (!password || password.length < 6)
      errors.set('Password', 'Senha deve ter pelo menos 6 caracteres')

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

  const onSignUp = async () => {
    try {
      setIsSigningUp(true)
      setError(undefined)
      setValidationErrors(new Map())

      const errors = validateForm()
      setValidationErrors(errors)
      if (errors.size > 0)
        return

      await signUp({ email, password, username })
    }
    catch (e: unknown) {
      if (__DEV__)
        console.error('Erro durante cadastro:', e)

      const isUserExists = e && typeof e === 'object' && 'message' in e
        ? e.message === 'User already registered'
        : false

      Toast.show({
        type: 'error',
        text1: 'Erro ao criar conta',
        text2: isUserExists
          ? 'Este email já está cadastrado'
          : 'Ocorreu um erro ao tentar criar sua conta',
        topOffset: 50,
        visibilityTime: 3000,
        autoHide: true,
      })
    }
    finally {
      setIsSigningUp(false)
    }
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
              label="Nome de usuário"
              autoCapitalize="none"
              autoCorrect={false}
              defaultValue={username}
              onChangeText={setUsername}
              readOnly={isSigningUp}
              onSubmitEditing={() => emailInput.current?.focus()}
              returnKeyType="next"
              helper={validationErrors.get('Username')}
              status={validationErrors.get('Username') ? 'error' : undefined}
            />
            <TextField
              ref={emailInput}
              containerStyle={$textField}
              label="Email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              defaultValue={email}
              onChangeText={setEmail}
              readOnly={isSigningUp}
              onSubmitEditing={() => passwordInput.current?.focus()}
              returnKeyType="next"
              inputMode="email"
              helper={validationErrors.get('Email')}
              status={validationErrors.get('Email') ? 'error' : undefined}
            />
            <TextField
              ref={passwordInput}
              containerStyle={$textField}
              label="Senha"
              autoCapitalize="none"
              autoComplete="new-password"
              autoCorrect={false}
              defaultValue={password}
              onSubmitEditing={onSignUp}
              returnKeyType="done"
              secureTextEntry={isPasswordHidden}
              onChangeText={setPassword}
              RightAccessory={PasswordAccessory}
              readOnly={isSigningUp}
              helper={validationErrors.get('Password')}
              status={validationErrors.get('Password') ? 'error' : undefined}
            />
          </View>
          <View>
            <Button
              onPress={onSignUp}
              disabled={isSigningUp}
            >
              {isSigningUp ? 'Criando conta...' : 'Criar conta'}
            </Button>
            <Text style={$buttonDivider}>- ou -</Text>
            <Button
              preset="reversed"
              onPress={() => navigation.goBack()}
              disabled={isSigningUp}
            >
              Voltar para login
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

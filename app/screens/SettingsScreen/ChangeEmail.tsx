import { FC, useState } from "react"
import { observer } from "mobx-react-lite"
import { ViewStyle, View, TextStyle } from "react-native"
import { AppStackScreenProps } from "@/navigators"
import { Screen, Header, TextField, Button, Text } from "@/components"
import { spacing } from "@/theme"
import { useNavigation } from "@react-navigation/native"
import { useStores } from "@/models"
import { useAppTheme } from "@/utils/useAppTheme"
import type { ThemedStyle } from "@/theme"

interface ChangeEmailScreenProps extends AppStackScreenProps<"ChangeEmail"> {}

export const ChangeEmailScreen: FC<ChangeEmailScreenProps> = observer(function ChangeEmailScreen() {
  const navigation = useNavigation()
  const { userStore } = useStores()
  const { themed } = useAppTheme()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [validationErrors, setValidationErrors] = useState<Map<string, string>>(new Map())

  const validateForm = () => {
    const errors: Map<string, string> = new Map()

    if (!currentPassword) {
      errors.set("currentPassword", "Senha é obrigatória")
    }

    if (!newEmail) {
      errors.set("newEmail", "Novo email é obrigatório")
    } else if (!newEmail.includes("@") || !newEmail.includes(".")) {
      errors.set("newEmail", "Email inválido")
    }

    return errors
  }

  const checkEmail = async (value: string) => {
    if (!value.trim() || !value.includes("@") || !value.includes(".")) {
      return
    }

    const errorMessage = await userStore.checkEmailExists(value)
    if (errorMessage) {
      setValidationErrors(new Map([["newEmail", errorMessage]]))
    } else {
      setValidationErrors(new Map())
    }
  }

  const handleChangeEmail = async () => {
    setError("")
    const errors = validateForm()
    setValidationErrors(errors)
    if (errors.size > 0) return

    setIsSubmitting(true)

    try {
      const result = await userStore.updateEmail({
        email: newEmail.trim(),
        password: currentPassword,
      })

      if (result.success) {
        navigation.goBack()
      } else {
        setError(result.error || "Erro ao alterar email")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Screen preset="scroll" contentContainerStyle={themed($screenContainer)}>
      <Header
        title="Alterar Email"
        leftIcon="back"
        onLeftPress={() => navigation.goBack()}
        titleStyle={themed($headerTitle)}
      />

      <View style={themed($container)}>
        {error && <Text text={error} preset="formHelper" style={themed($errorMessage)} />}
        <TextField
          value={currentPassword}
          onChangeText={setCurrentPassword}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          containerStyle={$textField}
          placeholder="Digite sua senha"
          label="SENHA"
          status={validationErrors.get("currentPassword") ? "error" : undefined}
          helper={validationErrors.get("currentPassword")}
        />

        <TextField
          value={newEmail}
          onChangeText={(value) => {
            setNewEmail(value)
            checkEmail(value)
          }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          containerStyle={$textField}
          placeholder="Digite seu novo email"
          label="NOVO EMAIL"
          status={validationErrors.get("newEmail") ? "error" : undefined}
          helper={validationErrors.get("newEmail")}
        />

        <Button
          text={isSubmitting ? "Alterando..." : "Alterar Email"}
          preset="filled"
          onPress={handleChangeEmail}
          style={$button}
          disabled={isSubmitting || !currentPassword || !newEmail || validationErrors.size > 0}
        />
      </View>
    </Screen>
  )
})

const $screenContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
})

const $headerTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
})

const $container: ViewStyle = {
  padding: spacing.lg,
}

const $textField: ViewStyle = {
  marginBottom: spacing.lg,
}

const $button: ViewStyle = {
  minHeight: 50,
}

const $errorMessage: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.error,
  marginBottom: spacing.lg,
})

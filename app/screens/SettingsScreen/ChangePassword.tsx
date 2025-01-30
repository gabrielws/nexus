import { FC, useState } from "react"
import { observer } from "mobx-react-lite"
import { ViewStyle, View, TextStyle } from "react-native"
import { AppStackScreenProps } from "@/navigators"
import { Screen, Header, TextField, Button, Text } from "@/components"
import { spacing } from "@/theme"
import { useNavigation } from "@react-navigation/native"
import { supabase } from "app/services/auth/supabase"
import { useAppTheme } from "@/utils/useAppTheme"
import type { ThemedStyle } from "@/theme"

interface ChangePasswordScreenProps extends AppStackScreenProps<"ChangePassword"> {}

export const ChangePasswordScreen: FC<ChangePasswordScreenProps> = observer(
  function ChangePasswordScreen() {
    const navigation = useNavigation()
    const { themed } = useAppTheme()
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")
    const [validationErrors, setValidationErrors] = useState<Map<string, string>>(new Map())

    const validateForm = () => {
      const errors: Map<string, string> = new Map()

      if (!currentPassword) {
        errors.set("currentPassword", "Senha atual é obrigatória")
      }

      if (!newPassword) {
        errors.set("newPassword", "Nova senha é obrigatória")
      } else if (newPassword.length < 6) {
        errors.set("newPassword", "Nova senha deve ter pelo menos 6 caracteres")
      }

      if (!confirmPassword) {
        errors.set("confirmPassword", "Confirmação de senha é obrigatória")
      } else if (confirmPassword !== newPassword) {
        errors.set("confirmPassword", "As senhas não coincidem")
      }

      return errors
    }

    const handleChangePassword = async () => {
      setError("")
      const errors = validateForm()
      setValidationErrors(errors)
      if (errors.size > 0) return

      setIsSubmitting(true)

      try {
        // Verifica a senha atual
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: (await supabase.auth.getUser()).data.user?.email || "",
          password: currentPassword,
        })

        if (signInError) throw new Error("Senha atual incorreta")

        // Atualiza a senha
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        })

        if (updateError) throw updateError

        navigation.goBack()
      } catch (err: any) {
        console.error("Erro ao alterar senha:", err)
        setError(err.message || "Erro ao alterar senha")
      } finally {
        setIsSubmitting(false)
      }
    }

    return (
      <Screen preset="scroll" contentContainerStyle={themed($screenContainer)}>
        <Header
          title="Alterar Senha"
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
            placeholder="Digite sua senha atual"
            label="SENHA ATUAL"
            status={validationErrors.get("currentPassword") ? "error" : undefined}
            helper={validationErrors.get("currentPassword")}
          />

          <TextField
            value={newPassword}
            onChangeText={setNewPassword}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            containerStyle={$textField}
            placeholder="Digite sua nova senha"
            label="NOVA SENHA"
            status={validationErrors.get("newPassword") ? "error" : undefined}
            helper={validationErrors.get("newPassword")}
          />

          <TextField
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            containerStyle={$textField}
            placeholder="Confirme sua nova senha"
            label="CONFIRMAR SENHA"
            status={validationErrors.get("confirmPassword") ? "error" : undefined}
            helper={validationErrors.get("confirmPassword")}
          />

          <Button
            text={isSubmitting ? "Alterando..." : "Alterar Senha"}
            preset="filled"
            onPress={handleChangePassword}
            style={$button}
            disabled={
              isSubmitting ||
              !currentPassword ||
              !newPassword ||
              !confirmPassword ||
              validationErrors.size > 0
            }
          />
        </View>
      </Screen>
    )
  },
)

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

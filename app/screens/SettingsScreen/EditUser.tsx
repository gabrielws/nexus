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
import { supabase } from "app/services/auth/supabase"

interface EditUserScreenProps extends AppStackScreenProps<"EditUser"> {}

export const EditUserScreen: FC<EditUserScreenProps> = observer(function EditUserScreen() {
  const navigation = useNavigation()
  const { userStore } = useStores()
  const { themed } = useAppTheme()
  const [username, setUsername] = useState(userStore.profile?.username || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [validationErrors, setValidationErrors] = useState<Map<string, string>>(new Map())

  const validateForm = () => {
    const errors: Map<string, string> = new Map()

    if (!username.trim()) {
      errors.set("username", "Nome de usuário é obrigatório")
    } else if (username.trim().length < 3) {
      errors.set("username", "Nome de usuário deve ter pelo menos 3 caracteres")
    }

    return errors
  }

  const checkUsername = async (value: string) => {
    if (!value.trim()) {
      setError("")
      return
    }

    // Não verifica se o username é igual ao atual do usuário (case insensitive)
    if (value.trim().toUpperCase() === userStore.profile?.username?.toUpperCase()) {
      setError("")
      return
    }

    const { data } = await supabase
      .from("user_profiles")
      .select("username")
      .eq("username", value.trim())
      .neq("id", userStore.profile?.id)
      .maybeSingle()

    if (data?.username?.toUpperCase() === value.trim().toUpperCase()) {
      setValidationErrors(new Map([["username", "Este nome de usuário já está em uso"]]))
    } else {
      setValidationErrors(new Map())
    }
  }

  const handleSave = async () => {
    setError("")
    const errors = validateForm()
    setValidationErrors(errors)
    if (errors.size > 0) return

    setIsSubmitting(true)

    try {
      await userStore.updateProfile({ username: username.trim() })
      navigation.goBack()
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error)
      setError("Erro ao atualizar usuário")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Screen preset="scroll" contentContainerStyle={themed($screenContainer)}>
      <Header
        title="Editar Usuário"
        leftIcon="back"
        onLeftPress={() => navigation.goBack()}
        titleStyle={themed($headerTitle)}
      />

      <View style={themed($container)}>
        {error && <Text text={error} preset="formHelper" style={themed($errorMessage)} />}
        <Text preset="formLabel" text="NOME DE USUÁRIO" style={themed($label)} />
        <TextField
          value={username}
          onChangeText={(value) => {
            setUsername(value)
            checkUsername(value)
          }}
          autoCapitalize="none"
          autoCorrect={false}
          containerStyle={$textField}
          placeholder="Digite seu nome de usuário"
          status={validationErrors.get("username") ? "error" : undefined}
          helper={validationErrors.get("username")}
        />

        <Button
          text={isSubmitting ? "Salvando..." : "Salvar"}
          preset="filled"
          onPress={handleSave}
          style={$button}
          disabled={isSubmitting || !username || validationErrors.size > 0}
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

const $label: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  marginBottom: spacing.xs,
})

const $textField: ViewStyle = {
  marginBottom: spacing.lg,
}

const $button: ViewStyle = {
  minHeight: 50,
}

const $errorMessage: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.error,
  marginBottom: spacing.xs,
})

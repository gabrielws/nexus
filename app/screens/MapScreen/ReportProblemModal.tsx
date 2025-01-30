import { FC, useState } from "react"
import {
  ViewStyle,
  View,
  TextStyle,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { observer } from "mobx-react-lite"
import { Button, Screen, Text, TextField } from "@/components"
import { spacing } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import type { ThemedStyle } from "@/theme"
import { CategoryPicker } from "@/components/CategoryPicker"
import { ImagePickerField } from "@/components/ImagePickerField"
import { useStores } from "@/models"
import { ProblemCategory } from "@/models/ProblemStore"
import { useAuth } from "@/services/auth/useAuth"
import { uploadImage } from "@/services/supabase/storage"
import { nanoid } from "@/utils/nanoid"
import { useTranslation } from "react-i18next"

export interface ReportProblemModalProps {
  /**
   * Coordenadas do local selecionado
   */
  coordinates: [number, number]
  /**
   * Callback quando o modal for fechado
   */
  onClose: () => void
  /**
   * Callback quando o problema for reportado com sucesso
   */
  onSuccess: () => void
  /**
   * Callback para mostrar animação de XP
   */
  onShowXp?: () => void
}

export const ReportProblemModal: FC<ReportProblemModalProps> = observer(
  function ReportProblemModal(props) {
    const { t } = useTranslation()
    const { coordinates, onClose, onSuccess, onShowXp } = props
    const { themed } = useAppTheme()
    const { problemStore } = useStores()
    const { session } = useAuth()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [category, setCategory] = useState<ProblemCategory>(ProblemCategory.Maintenance)
    const [imageUri, setImageUri] = useState<string>()
    const [validationErrors, setValidationErrors] = useState<Map<string, string>>(new Map())

    const validateForm = () => {
      const errors = new Map<string, string>()

      // Validações de título
      if (!title.trim()) {
        errors.set("title", t("map.report.form.title.errors.required"))
      } else if (title.length < 5) {
        errors.set("title", t("map.report.form.title.errors.tooShort"))
      } else if (title.length > 100) {
        errors.set("title", t("map.report.form.title.errors.tooLong"))
      }

      // Validações de descrição
      if (!description.trim()) {
        errors.set("description", t("map.report.form.description.errors.required"))
      } else if (description.length < 10) {
        errors.set("description", t("map.report.form.description.errors.tooShort"))
      } else if (description.length > 1000) {
        errors.set("description", t("map.report.form.description.errors.tooLong"))
      }

      // Validação de categoria
      if (!category) {
        errors.set("category", t("map.report.form.category.errors.required"))
      }

      // Validação de imagem
      if (!imageUri) {
        errors.set("image", t("map.report.form.photo.errors.required"))
      }

      // Validação de coordenadas
      const [longitude, latitude] = coordinates
      if (longitude < -180 || longitude > 180) {
        errors.set("location", t("map.report.form.location.errors.longitude"))
      }
      if (latitude < -90 || latitude > 90) {
        errors.set("location", t("map.report.form.location.errors.latitude"))
      }

      return errors
    }

    const handleSubmit = async () => {
      if (!session?.user?.id) {
        setValidationErrors(new Map([["auth", t("map.report.form.submit.auth")]]))
        return
      }

      const errors = validateForm()
      setValidationErrors(errors)
      if (errors.size > 0) return

      setIsSubmitting(true)
      try {
        // 1. Faz upload da imagem
        const imagePath = `problems/${nanoid()}.jpg`
        const imageUrl = await uploadImage(imageUri!, imagePath)
        if (!imageUrl) {
          throw new Error(t("map.report.form.photo.errors.upload"))
        }

        // 2. Cria o problema
        await problemStore.reportProblem({
          title: title.trim(),
          description: description.trim(),
          category,
          location: {
            type: "Point",
            coordinates,
          },
          imageUrl,
          userId: session.user.id,
        })

        onSuccess()
        onShowXp?.()
      } catch (error: any) {
        console.error("Erro ao reportar problema:", error)

        // Tratamento específico de erros
        if (error.message === t("map.report.form.photo.errors.upload")) {
          setValidationErrors(new Map([["image", t("map.report.form.photo.errors.upload")]]))
        } else {
          setValidationErrors(new Map([["general", t("map.report.form.submit.error")]]))
        }
      } finally {
        setIsSubmitting(false)
      }
    }

    return (
      <KeyboardAvoidingView
        style={themed($keyboardAvoid)}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <Screen
          preset="fixed"
          contentContainerStyle={themed($screenContainer)}
          style={themed($modal)}
          safeAreaEdges={["top"]}
        >
          <View style={themed($header)}>
            <Text weight="bold" size="xl" tx="map:report.title" style={themed($title)} />
            <Button preset="default" onPress={onClose} tx="common:close" />
          </View>

          <ScrollView
            style={$content}
            contentContainerStyle={$contentContainer}
            keyboardShouldPersistTaps="handled"
          >
            {/* Erro geral ou de autenticação */}
            {(validationErrors.has("general") || validationErrors.has("auth")) && (
              <Text
                preset="formHelper"
                tx={
                  validationErrors.has("general")
                    ? "map:report.form.submit.error"
                    : "map:report.form.submit.auth"
                }
                style={$errorMessage}
              />
            )}

            {/* Erro de localização */}
            {validationErrors.has("location") && (
              <Text
                preset="formHelper"
                tx="map:report.form.location.errors.invalid"
                style={$errorMessage}
              />
            )}

            <TextField
              labelTx="map:report.form.title.label"
              value={title}
              onChangeText={setTitle}
              placeholderTx="map:report.form.title.placeholder"
              maxLength={100}
              status={validationErrors.has("title") ? "error" : undefined}
              helper={validationErrors.get("title")}
              editable={!isSubmitting}
            />

            <TextField
              labelTx="map:report.form.description.label"
              value={description}
              onChangeText={setDescription}
              placeholderTx="map:report.form.description.placeholder"
              multiline
              maxLength={1000}
              status={validationErrors.has("description") ? "error" : undefined}
              helper={validationErrors.get("description")}
              editable={!isSubmitting}
            />

            <View>
              <Text preset="formLabel" tx="map:report.form.category.label" style={themed($label)} />
              <CategoryPicker
                value={category}
                onValueChange={(value: ProblemCategory) => setCategory(value)}
                error={validationErrors.get("category")}
                disabled={isSubmitting}
              />
            </View>

            <View>
              <Text preset="formLabel" tx="map:report.form.photo.label" style={themed($label)} />
              <ImagePickerField
                value={imageUri}
                onImageSelected={setImageUri}
                onImageRemoved={() => setImageUri(undefined)}
                disabled={isSubmitting}
                error={validationErrors.get("image")}
              />
            </View>

            <View style={$footer}>
              <Button
                preset="filled"
                tx={
                  isSubmitting ? "map:report.form.submit.sending" : "map:report.form.submit.button"
                }
                onPress={handleSubmit}
                disabled={isSubmitting}
                style={$submitButton}
              />
            </View>
          </ScrollView>
        </Screen>
      </KeyboardAvoidingView>
    )
  },
)

const $keyboardAvoid: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.background,
})

const $modal: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
})

const $screenContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
  flex: 1,
})

const $header: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  padding: spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: colors.border,
})

const $title: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
})

const $content: ViewStyle = {
  flex: 1,
}

const $contentContainer: ViewStyle = {
  padding: spacing.md,
  gap: spacing.md,
}

const $footer: ViewStyle = {
  marginTop: spacing.xl,
}

const $submitButton: ViewStyle = {
  minHeight: 50,
}

const $errorMessage: TextStyle = {
  marginBottom: spacing.xs,
  textAlign: "center",
}

const $label: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  marginBottom: spacing.xs,
})

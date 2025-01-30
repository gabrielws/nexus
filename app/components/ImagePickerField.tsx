import { FC, useState } from "react"
import {
  ViewStyle,
  View,
  Image,
  Pressable,
  TextStyle,
  ActivityIndicator,
  ImageStyle,
} from "react-native"
import { observer } from "mobx-react-lite"
import { Text } from "./Text"
import { spacing } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import type { ThemedStyle } from "@/theme"
import * as ImagePicker from "expo-image-picker"
import * as ImageManipulator from "expo-image-manipulator"
import { Icon } from "./Icon"

export interface ImagePickerFieldProps {
  /**
   * URI da imagem selecionada
   */
  value?: string
  /**
   * Callback quando uma imagem é selecionada
   */
  onImageSelected: (uri: string) => void
  /**
   * Callback quando a imagem é removida
   */
  onImageRemoved: () => void
  /**
   * Label do campo
   */
  label?: string
  /**
   * Mensagem de erro
   */
  error?: string
  /**
   * Se o componente está desabilitado
   */
  disabled?: boolean
}

/**
 * Componente para seleção de imagem com opções de câmera e galeria.
 */
export const ImagePickerField: FC<ImagePickerFieldProps> = observer(
  function ImagePickerField(props) {
    const { value, onImageSelected, onImageRemoved, label, error, disabled } = props
    const { themed } = useAppTheme()
    const [isLoading, setIsLoading] = useState(false)

    const requestPermission = async (type: "camera" | "gallery") => {
      if (type === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        return status === "granted"
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        return status === "granted"
      }
    }

    const processImage = async (uri: string) => {
      try {
        console.log("🔄 Processando imagem...")
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          uri,
          [
            { resize: { width: 1080 } }, // Redimensiona para largura máxima de 1080px
          ],
          {
            compress: 0.7, // Compressão de 70%
            format: ImageManipulator.SaveFormat.JPEG,
          },
        )

        console.log("✅ Imagem processada com sucesso")
        return manipulatedImage.uri
      } catch (error) {
        console.error("❌ Erro ao processar imagem:", error)
        return uri // Retorna URI original em caso de erro
      }
    }

    const handleSelectImage = async (type: "camera" | "gallery") => {
      if (disabled || isLoading) return

      try {
        setIsLoading(true)
        const hasPermission = await requestPermission(type)
        if (!hasPermission) {
          console.log("Permissão negada")
          return
        }

        const options: ImagePicker.ImagePickerOptions = {
          mediaTypes: "images",
          allowsEditing: false,
          quality: 1, // Qualidade máxima, vamos comprimir depois
        }

        const result =
          type === "camera"
            ? await ImagePicker.launchCameraAsync(options)
            : await ImagePicker.launchImageLibraryAsync(options)

        if (!result.canceled && result.assets[0]) {
          const processedUri = await processImage(result.assets[0].uri)
          onImageSelected(processedUri)
        }
      } catch (error) {
        console.error("Erro ao selecionar imagem:", error)
      } finally {
        setIsLoading(false)
      }
    }

    return (
      <View style={$container}>
        {label && <Text preset="formLabel" text={label} style={themed($label)} />}

        {!value ? (
          <View style={$buttonsContainer}>
            <Pressable
              style={[themed($button), disabled && themed($buttonDisabled)]}
              onPress={() => handleSelectImage("camera")}
              disabled={disabled || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text text="📸" style={$buttonIcon} />
                  <Text
                    preset="formHelper"
                    text="Tirar Foto"
                    style={[themed($buttonText), disabled && themed($buttonTextDisabled)]}
                  />
                </>
              )}
            </Pressable>

            <Pressable
              style={[themed($button), disabled && themed($buttonDisabled)]}
              onPress={() => handleSelectImage("gallery")}
              disabled={disabled || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text text="🖼️" style={$buttonIcon} />
                  <Text
                    preset="formHelper"
                    text="Galeria"
                    style={[themed($buttonText), disabled && themed($buttonTextDisabled)]}
                  />
                </>
              )}
            </Pressable>
          </View>
        ) : (
          <View style={themed($imageContainer)}>
            <Image source={{ uri: value }} style={$image as ImageStyle} resizeMode="cover" />
            <Pressable
              style={[themed($removeButton), disabled && themed($buttonDisabled)]}
              onPress={onImageRemoved}
              disabled={disabled}
            >
              <Icon icon="x" size={16} color={themed(({ colors }) => colors.text)} />
            </Pressable>
          </View>
        )}

        {error && <Text preset="formHelper" text={error} style={themed($error)} />}
      </View>
    )
  },
)

const $container: ViewStyle = {
  gap: spacing.xs,
}

const $label: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
})

const $buttonsContainer: ViewStyle = {
  flexDirection: "row",
  gap: spacing.sm,
}

const $button: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  borderRadius: spacing.xs,
  backgroundColor: colors.tint,
  gap: spacing.xs,
})

const $buttonDisabled: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.separator,
})

const $buttonIcon: TextStyle = {
  fontSize: 16,
}

const $buttonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.background,
})

const $buttonTextDisabled: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $imageContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: "relative",
  borderRadius: spacing.xs,
  borderWidth: 1,
  borderColor: colors.border,
  overflow: "hidden",
})

const $image: ViewStyle = {
  width: "100%",
  height: 320,
}

const $removeButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: "absolute",
  top: spacing.xs,
  right: spacing.xs,
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: colors.tint,
  alignItems: "center",
  justifyContent: "center",
})

const $error: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.error,
})

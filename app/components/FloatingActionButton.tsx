import { Pressable, ViewStyle, StyleProp } from "react-native"
import { observer } from "mobx-react-lite"
import { spacing } from "@/theme"
import { MaterialIcons } from "@expo/vector-icons"
import { useAppTheme } from "@/utils/useAppTheme"
import type { ThemedStyle } from "@/theme"

export interface FloatingActionButtonProps {
  /**
   * Função chamada ao pressionar o botão
   */
  onPress: () => void
  /**
   * Ícone a ser exibido no botão
   */
  icon?: "add" | "close" | "navigation" | "history"
  /**
   * Estilo opcional para sobrescrever o estilo padrão
   */
  style?: StyleProp<ViewStyle>
  /**
   * Se o botão está desabilitado
   */
  disabled?: boolean
}

/**
 * Botão de ação flutuante (FAB) que pode ser usado em qualquer tela.
 * Exemplo:
 * ```tsx
 * <FloatingActionButton onPress={() => {}} icon="add" />
 * ```
 */
export const FloatingActionButton = observer(function FloatingActionButton(
  props: FloatingActionButtonProps,
) {
  const { onPress, icon = "add", style, disabled } = props
  const { themed, theme } = useAppTheme()

  const getIconName = () => {
    switch (icon) {
      case "close":
        return "close"
      case "navigation":
        return "navigation"
      case "history":
        return "history"
      default:
        return "add"
    }
  }

  return (
    <Pressable
      style={({ pressed }) => [themed($container), pressed && themed($containerPressed), style]}
      onPress={onPress}
      disabled={disabled}
    >
      <MaterialIcons name={getIconName()} size={24} color={theme.colors.text} />
    </Pressable>
  )
})

const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: "absolute",
  bottom: spacing.lg,
  right: spacing.lg,
  width: 56,
  height: 56,
  borderRadius: 15,
  backgroundColor: colors.background,
  justifyContent: "center",
  alignItems: "center",
  borderWidth: 1,
  borderColor: colors.border,
})

const $containerPressed: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.tintInactive,
  transform: [{ scale: 0.97 }],
})

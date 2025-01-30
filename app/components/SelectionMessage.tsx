import { ViewStyle, Animated, StyleProp, TextStyle } from "react-native"
import { observer } from "mobx-react-lite"
import { spacing } from "@/theme"
import { Text } from "./Text"
import { useAppTheme } from "@/utils/useAppTheme"
import type { ThemedStyle } from "@/theme"
import { useEffect, useRef } from "react"

export interface SelectionMessageProps {
  /**
   * Se a mensagem está visível
   */
  visible: boolean
  /**
   * Estilo opcional para sobrescrever o estilo padrão
   */
  style?: StyleProp<ViewStyle>
}

/**
 * Componente que mostra uma mensagem flutuante com animação de fade.
 */
export const SelectionMessage = observer(function SelectionMessage(props: SelectionMessageProps) {
  const { visible, style } = props
  const { themed } = useAppTheme()
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }, [opacity, visible])

  if (!visible) return null

  return (
    <Animated.View style={[themed($container), { opacity }, style]}>
      <Text
        weight="medium"
        size="sm"
        style={themed($text)}
        text="Clique no mapa para adicionar um problema"
      />
    </Animated.View>
  )
})

const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: "absolute",
  top: spacing.lg,
  left: spacing.lg,
  right: spacing.lg,
  backgroundColor: colors.background,
  padding: spacing.sm,
  borderRadius: spacing.sm,
  alignItems: "center",
  elevation: 4,
  shadowColor: colors.tint,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
})

const $text: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
})

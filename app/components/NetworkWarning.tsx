import { FC } from "react"
import { observer } from "mobx-react-lite"
import { ViewStyle, TextStyle, View, Pressable } from "react-native"
import { Text } from "./Text"
import { spacing, typography } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import type { ThemedStyle } from "@/theme"
import Animated, { FadeIn, FadeOut } from "react-native-reanimated"
import { Icon } from "./Icon"

export interface NetworkWarningProps {
  /**
   * Callback opcional quando o botão de retry for pressionado
   */
  onRetry?: () => void
  /**
   * Se está tentando reconectar
   */
  isRetrying?: boolean
}

export const NetworkWarning: FC<NetworkWarningProps> = observer(function NetworkWarning({
  onRetry,
  isRetrying,
}) {
  const { themed } = useAppTheme()

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={$root}>
      {/* Backdrop semi-transparente */}
      <View style={themed($backdrop)} />

      <View style={themed($container)}>
        <View style={$content}>
          <Icon icon="x" size={32} color={themed($warningIcon).color as string} />
          <View style={$textContainer}>
            <Text
              weight="bold"
              size="lg"
              text="Sem conexão com a internet"
              style={themed($title)}
            />
            <Text
              weight="normal"
              size="sm"
              text="Conecte-se à internet para visualizar o mapa e reportar problemas"
              style={themed($subtitle)}
            />
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            themed($retryButton),
            pressed && themed($retryButtonPressed),
            isRetrying && themed($retryButtonDisabled),
          ]}
          onPress={onRetry}
          disabled={isRetrying}
        >
          <Text
            weight="medium"
            size="sm"
            text={isRetrying ? "Reconectando..." : "Tentar novamente"}
            style={themed($buttonText)}
          />
        </Pressable>
      </View>
    </Animated.View>
  )
})

const $root: ViewStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
}

const $backdrop: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: colors.background,
  opacity: 0.7,
})

const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
  borderRadius: spacing.sm,
  padding: spacing.md,
  shadowColor: colors.separator,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
  borderWidth: 1,
  borderColor: colors.separator,
  width: "90%",
  maxWidth: 400,
})

const $content: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: spacing.sm,
}

const $textContainer: ViewStyle = {
  flex: 1,
  marginLeft: spacing.sm,
}

const $title: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  marginBottom: spacing.xs,
})

const $subtitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $warningIcon: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.error,
})

const $retryButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.tint,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  borderRadius: spacing.xs,
  alignItems: "center",
})

const $retryButtonPressed: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.tint,
})

const $retryButtonDisabled: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.separator,
})

const $buttonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.background,
  fontFamily: typography.primary.medium,
})

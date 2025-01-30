import { StyleProp, TextStyle, View, ViewStyle } from "react-native"
import { observer } from "mobx-react-lite"
import { useAppTheme } from "@/utils/useAppTheme"
import type { ThemedStyle } from "@/theme"
import { Text } from "@/components/Text"
import Animated, {
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  useSharedValue,
  withDelay,
  Easing,
} from "react-native-reanimated"
import { useEffect } from "react"
import { spacing } from "@/theme"
import { LinearGradient } from "expo-linear-gradient"
import MaskedView from "@react-native-masked-view/masked-view"

export interface XpAnimationProps {
  /**
   * Quantidade de XP a ser mostrada
   */
  xp: number
  /**
   * Callback opcional chamado quando a animação terminar
   */
  onAnimationComplete?: () => void
  /**
   * An optional style override useful for padding & margin.
   */
  style?: StyleProp<ViewStyle>
}

/**
 * Componente que mostra uma animação de XP ganho.
 * Exemplo:
 * ```tsx
 * <XpAnimation xp={50} onAnimationComplete={() => console.log('Animação concluída')} />
 * ```
 */
export const XpAnimation = observer(function XpAnimation(props: XpAnimationProps) {
  const { xp, style, onAnimationComplete } = props
  const { themed } = useAppTheme()

  // Configurações de animação
  const MOVEMENT_DURATION = 400
  const VISIBLE_DURATION = 2000
  const FADE_DURATION = 300
  const BACKDROP_FADE_DURATION = 150 // Ainda mais rápido para o backdrop
  const BACKDROP_VISIBLE_DURATION = VISIBLE_DURATION - 100 // Começa a desaparecer um pouco antes
  const SHIMMER_DURATION = 1000
  const PULSE_DURATION = 400
  const TOTAL_DURATION = MOVEMENT_DURATION + VISIBLE_DURATION + FADE_DURATION

  // Animação do shimmer
  const shimmerTranslate = useSharedValue(-100)
  // Animação do pulse
  const textScale = useSharedValue(1)
  // Animação do backdrop
  const backdropOpacity = useSharedValue(0)

  useEffect(() => {
    // Backdrop fade in/out - mais rápido na saída e começa antes
    backdropOpacity.value = withSequence(
      withTiming(0.7, { duration: MOVEMENT_DURATION }),
      withTiming(0.7, { duration: BACKDROP_VISIBLE_DURATION }),
      withTiming(0, {
        duration: BACKDROP_FADE_DURATION,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
    )

    // Inicia o shimmer após o movimento inicial
    shimmerTranslate.value = withDelay(
      MOVEMENT_DURATION,
      withTiming(100, { duration: SHIMMER_DURATION }),
    )

    // Pulse do texto
    textScale.value = withDelay(
      MOVEMENT_DURATION + SHIMMER_DURATION / 2,
      withSequence(
        withSpring(1.2, { damping: 12, stiffness: 180 }),
        withTiming(1, { duration: PULSE_DURATION }),
      ),
    )

    const timer = setTimeout(() => {
      onAnimationComplete?.()
    }, TOTAL_DURATION)

    return () => clearTimeout(timer)
  }, [TOTAL_DURATION, onAnimationComplete, shimmerTranslate, textScale, backdropOpacity])

  // Estilo do backdrop
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }))

  // Estilo do shimmer
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerTranslate.value }],
  }))

  // Estilo do texto com pulse
  const textStyle = useAnimatedStyle(() => ({
    transform: [{ scale: textScale.value }],
  }))

  // Estilo animado principal
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withSequence(
        withTiming(0, { duration: 0 }), // Começa invisível
        withTiming(1, {
          duration: MOVEMENT_DURATION,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
        withTiming(1, { duration: VISIBLE_DURATION }),
        withTiming(0, { duration: FADE_DURATION, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
      ),
      transform: [
        {
          translateY: withSequence(
            withTiming(50, { duration: 0 }), // Começa abaixo
            withSpring(0, {
              damping: 12,
              stiffness: 180,
              mass: 0.5,
              velocity: -8,
            }),
          ),
        },
        {
          scale: withSequence(
            withTiming(0.3, { duration: 0 }), // Começa pequeno
            withSpring(1, {
              damping: 8,
              stiffness: 150,
              mass: 0.5,
              velocity: 8,
            }),
          ),
        },
      ],
    }
  })

  return (
    <View style={$root}>
      {/* Backdrop escuro */}
      <Animated.View style={[themed($backdrop), backdropStyle]} />

      <Animated.View style={[themed($container), style, animatedStyle]}>
        <View style={$contentContainer}>
          <Animated.View style={textStyle}>
            <MaskedView
              style={$maskedContainer}
              maskElement={
                <Text weight="bold" size="xxl" style={[themed($xpText), $maskText]}>
                  +{xp}
                </Text>
              }
            >
              {/* Conteúdo visível através da máscara */}
              <Text weight="bold" size="xxl" style={themed($xpText)}>
                +{xp}
              </Text>

              {/* Shimmer que será visível apenas através do texto */}
              <Animated.View style={[themed($shimmerContainer), shimmerStyle]}>
                <LinearGradient
                  colors={["transparent", "rgba(255, 255, 255, 0.8)", "transparent"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={$gradient}
                />
              </Animated.View>
            </MaskedView>
          </Animated.View>
          <Text weight="medium" size="md" style={themed($xpLabel)}>
            XP
          </Text>
        </View>
      </Animated.View>
    </View>
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
}

const $backdrop: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: colors.background,
})

const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
  paddingHorizontal: spacing.xl,
  paddingVertical: spacing.lg,
  borderRadius: 16,
  // Sombra mais pronunciada
  shadowColor: colors.tint,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.5,
  shadowRadius: 12,
  elevation: 15,
  // Borda sutil
  borderWidth: 1,
  borderColor: colors.tint + "20",
})

const $contentContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
}

const $maskedContainer: ViewStyle = {
  flexDirection: "row",
  position: "relative",
}

const $maskText: TextStyle = {
  opacity: 1,
}

const $shimmerContainer: ViewStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  opacity: 0.7,
}

const $gradient: ViewStyle = {
  width: "100%",
  height: "100%",
}

const $xpText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontSize: 36,
  lineHeight: 42,
})

const $xpLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontSize: 16,
})

import { FC } from "react"
import { View, ViewStyle } from "react-native"
import Animated, { useAnimatedStyle } from "react-native-reanimated"
import { spacing } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import type { ThemedStyle } from "@/theme"

interface ProgressBarProps {
  progress: number // 0 a 100
  height?: number
  animated?: boolean
}

export const ProgressBar: FC<ProgressBarProps> = ({ progress, height = 12, animated = true }) => {
  const { themed } = useAppTheme()

  const animatedStyle = useAnimatedStyle(
    () => ({
      width: `${progress}%`,
      transform: [{ translateX: 0 }],
    }),
    [progress],
  )

  return (
    <View style={[themed($container), { height }]}>
      <Animated.View
        style={[
          themed($progress),
          { height },
          animated ? animatedStyle : { width: `${progress}%` },
        ]}
      />
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: "100%",
  backgroundColor: colors.palette.neutral200,
  borderRadius: spacing.xxs,
  overflow: "hidden",
})

const $progress: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.tint,
  borderRadius: spacing.xxs,
})

import { FC } from "react"
import { observer } from "mobx-react-lite"
import { View, ViewStyle } from "react-native"
import { useAppTheme } from "@/utils/useAppTheme"
import Svg, { Circle } from "react-native-svg"

interface ProgressRingProps {
  progress: number
}

export const ProgressRing: FC<ProgressRingProps> = observer(function ProgressRing({ progress }) {
  const { theme } = useAppTheme()

  return (
    <View style={$progressRing}>
      <Svg width={96} height={96}>
        {/* Círculo de fundo */}
        <Circle
          cx={48}
          cy={48}
          r={44}
          stroke={theme.colors.separator}
          strokeWidth={6}
          fill="none"
        />
        {/* Círculo de progresso */}
        <Circle
          cx={48}
          cy={48}
          r={44}
          stroke={theme.colors.tint}
          strokeWidth={6}
          fill="none"
          strokeDasharray={`${2 * Math.PI * 44}`}
          strokeDashoffset={2 * Math.PI * 44 * (1 - progress / 100)}
          transform="rotate(-90 48 48)"
        />
      </Svg>
    </View>
  )
})

const $progressRing: ViewStyle = {
  position: "absolute",
  width: 96,
  height: 96,
}

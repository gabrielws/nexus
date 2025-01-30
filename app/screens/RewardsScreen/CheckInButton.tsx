import { FC, useState } from "react"
import { observer } from "mobx-react-lite"
import { ViewStyle, ActivityIndicator, View } from "react-native"
import { Button } from "@/components"
import { useStores } from "@/models"
import { useAuth } from "@/services/auth/useAuth"
import { spacing } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import type { ThemedStyle } from "@/theme"

interface CheckInButtonProps {
  onSuccess?: (currentXp: number) => void
  currentXp: number
}

export const CheckInButton: FC<CheckInButtonProps> = observer(function CheckInButton({
  onSuccess,
  currentXp,
}) {
  const { userStore } = useStores()
  const { session } = useAuth()
  const { themed, theme } = useAppTheme()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCheckIn = async () => {
    if (!session?.user?.id || !userStore.canCheckIn || isSubmitting) return

    setIsSubmitting(true)
    try {
      await userStore.performDailyCheckIn(session.user.id)
      onSuccess?.(currentXp)
    } catch (error) {
      console.error("Erro ao fazer check-in:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Funções de debug
  const resetCheckIn = async () => {
    if (!session?.user?.id) return
    try {
      await userStore.resetCheckIn(session.user.id)
    } catch (error) {
      console.error("Erro ao resetar check-in:", error)
    }
  }

  const set24HoursAgo = async () => {
    if (!session?.user?.id) return
    try {
      const oneDayAgo = new Date()
      oneDayAgo.setHours(oneDayAgo.getHours() - 24)
      await userStore.setLastCheckIn(session.user.id, oneDayAgo.toISOString())
    } catch (error) {
      console.error("Erro ao definir check-in 24h atrás:", error)
    }
  }

  const set48HoursAgo = async () => {
    if (!session?.user?.id) return
    try {
      const twoDaysAgo = new Date()
      twoDaysAgo.setHours(twoDaysAgo.getHours() - 48)
      await userStore.setLastCheckIn(session.user.id, twoDaysAgo.toISOString())
    } catch (error) {
      console.error("Erro ao definir check-in 48h atrás:", error)
    }
  }

  // Determina o estilo e texto do botão baseado no estado
  const getButtonConfig = () => {
    if (isSubmitting) {
      return {
        text: "FAZENDO CHECK-IN...",
        preset: "filled" as const,
        style: [$button, themed($buttonThemedStyle)],
        disabled: true,
      }
    }

    if (!userStore.canCheckIn) {
      return {
        text: "CHECK-IN REALIZADO",
        preset: "reversed" as const,
        style: [$button, themed($buttonDisabledStyle)],
        disabled: true,
      }
    }

    return {
      text: "FAZER CHECK-IN",
      preset: "filled" as const,
      style: [$button, themed($buttonThemedStyle)],
      disabled: false,
    }
  }

  const buttonConfig = getButtonConfig()

  return (
    <View>
      <Button
        {...buttonConfig}
        onPress={handleCheckIn}
        RightAccessory={
          isSubmitting
            ? () => <ActivityIndicator color={theme.colors.text} style={$spinner} />
            : undefined
        }
      />

      {/* Botões de Debug */}
      {__DEV__ && (
        <View style={$debugContainer}>
          <Button
            preset="default"
            text="Resetar"
            onPress={resetCheckIn}
            style={[$debugButton, themed($debugButtonThemedStyle)]}
          />
          <Button
            preset="default"
            text="24h atrás"
            onPress={set24HoursAgo}
            style={[$debugButton, themed($debugButtonThemedStyle)]}
          />
          <Button
            preset="default"
            text="48h atrás"
            onPress={set48HoursAgo}
            style={[$debugButton, themed($debugButtonThemedStyle)]}
          />
        </View>
      )}
    </View>
  )
})

const $button: ViewStyle = {
  marginTop: spacing.sm,
}

const $buttonThemedStyle: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.tint,
})

const $buttonDisabledStyle: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.tintInactive,
})

const $spinner: ViewStyle = {
  marginLeft: spacing.xs,
}

const $debugContainer: ViewStyle = {
  marginTop: spacing.sm,
  flexDirection: "row",
  justifyContent: "space-between",
  gap: spacing.xs,
}

const $debugButton: ViewStyle = {
  flex: 1,
}

const $debugButtonThemedStyle: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.error,
  borderColor: colors.error,
})

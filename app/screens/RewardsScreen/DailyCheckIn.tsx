import { FC, useCallback, useEffect, useState } from "react"
import { observer } from "mobx-react-lite"
import { View, ViewStyle, TextStyle } from "react-native"
import { Text } from "@/components"
import { spacing, typography } from "@/theme"
import { useStores } from "@/models"
import { useAppTheme } from "@/utils/useAppTheme"
import type { ThemedStyle } from "@/theme"
import { REWARDS_CONFIG } from "@/config/rewards"
import { format } from "date-fns"
import { CheckInButton } from "./CheckInButton"

interface DailyCheckInProps {
  onCheckInSuccess?: (xp: number) => void
  onXpCalculated?: (xp: number) => void
}

export const DailyCheckIn: FC<DailyCheckInProps> = observer(function DailyCheckIn({
  onCheckInSuccess,
  onXpCalculated,
}) {
  const { userStore } = useStores()
  const { themed } = useAppTheme()
  const [timeLeft, setTimeLeft] = useState("")

  // Verifica se perdeu a streak
  const checkLostStreak = useCallback(() => {
    if (!userStore.profile?.last_check_in) return false

    const lastCheckIn = new Date(userStore.profile.last_check_in)
    const now = new Date()
    const hoursSinceLastCheckIn = (now.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60)

    return hoursSinceLastCheckIn >= REWARDS_CONFIG.CHECK_IN.HOURS_TO_RESET
  }, [userStore.profile?.last_check_in])

  // Calcula a streak efetiva (considerando se perdeu ou não)
  const getEffectiveStreak = useCallback(() => {
    if (!userStore.profile?.current_streak) return 0
    if (checkLostStreak()) return 0
    return userStore.profile.current_streak
  }, [checkLostStreak, userStore.profile?.current_streak])

  // Calcula o XP baseado na streak atual
  const getCheckInXp = useCallback(() => {
    if (checkLostStreak()) return REWARDS_CONFIG.CHECK_IN.BASE_XP
    const effectiveStreak = getEffectiveStreak()
    const xp =
      REWARDS_CONFIG.CHECK_IN.BASE_XP + effectiveStreak * REWARDS_CONFIG.CHECK_IN.STREAK_MULTIPLIER
    return xp
  }, [checkLostStreak, getEffectiveStreak])

  // Atualiza o XP calculado quando necessário
  useEffect(() => {
    if (userStore.canCheckIn) {
      const xp = getCheckInXp()
      onXpCalculated?.(xp)
    }
  }, [getCheckInXp, onXpCalculated, userStore.canCheckIn])

  // Timer preciso para próximo check-in
  useEffect(() => {
    const updateTimeLeft = () => {
      if (!userStore.profile?.last_check_in || userStore.canCheckIn) {
        setTimeLeft("")
        return
      }

      const lastCheckIn = new Date(userStore.profile.last_check_in)
      const nextCheckIn = new Date(
        lastCheckIn.getTime() + REWARDS_CONFIG.CHECK_IN.HOURS_BETWEEN_CHECKINS * 60 * 60 * 1000,
      )
      const now = new Date()
      const diff = nextCheckIn.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft("")
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      setTimeLeft(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`)
    }

    const timer = setInterval(updateTimeLeft, 1000)
    updateTimeLeft()
    return () => clearInterval(timer)
  }, [userStore.profile?.last_check_in, userStore.canCheckIn])

  return (
    <View style={themed($container)}>
      {/* Streaks */}
      <View style={$streaksContainer}>
        {/* Streak Atual */}
        <View style={$streakBox}>
          <View style={$streakHeader}>
            <Text text="🔥" style={themed($streakEmoji)} />
            <Text text="Sequência atual" style={themed($streakLabel)} />
          </View>
          <Text
            text={getEffectiveStreak().toString()}
            style={[themed($streakValue), checkLostStreak() && themed($lostStreakText)]}
          />
          {checkLostStreak() && (
            <Text text="Sequência perdida!" style={themed($lostStreakWarning)} />
          )}
        </View>

        <View style={themed($divider)} />

        {/* Streak Recorde */}
        <View style={$streakBox}>
          <View style={$streakHeader}>
            <Text text="👑" style={themed($streakEmoji)} />
            <Text text="Maior sequência" style={themed($streakLabel)} />
          </View>
          <Text
            text={userStore.profile?.max_streak.toString() || "0"}
            style={themed($streakValue)}
          />
        </View>
      </View>

      {/* Status do Check-in */}
      <View style={themed($statusSection)}>
        {userStore.canCheckIn ? (
          <View style={$statusContent}>
            <Text
              text={`Ganhe ${REWARDS_CONFIG.CHECK_IN.BASE_XP} XP hoje!`}
              style={themed($xpInfo)}
            />
            {getEffectiveStreak() > 0 && !checkLostStreak() && (
              <Text
                text={`+${getEffectiveStreak() * REWARDS_CONFIG.CHECK_IN.STREAK_MULTIPLIER} bônus de sequência`}
                style={themed($bonusInfo)}
              />
            )}
          </View>
        ) : timeLeft ? (
          <View style={$statusContent}>
            <View style={$timerRow}>
              <View style={$timerInfo}>
                <Text text="Próximo check-in em" style={themed($timerLabel)} />
                <Text text={timeLeft} style={themed($timerValue)} />
              </View>
            </View>
          </View>
        ) : (
          <Text text="Calculando tempo restante..." style={themed($timerLabel)} />
        )}
      </View>

      {/* Botão de Check-in */}
      <CheckInButton
        currentXp={getCheckInXp()}
        onSuccess={(xp) => {
          onCheckInSuccess?.(xp)
        }}
      />

      {/* Último check-in */}
      {userStore.profile?.last_check_in && (
        <Text
          text={`Último check-in: ${format(new Date(userStore.profile.last_check_in), "dd/MM")}`}
          style={themed($lastCheckIn)}
        />
      )}

      {/* Mensagem de erro */}
      {userStore.errorMessage && (
        <View style={themed($errorContainer)}>
          <Text text="⚠️" style={themed($errorIcon)} />
          <Text text={userStore.errorMessage} style={themed($errorText)} />
        </View>
      )}
    </View>
  )
})

const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
  borderRadius: spacing.sm,
  padding: spacing.md,
  elevation: 4,
})

const $streaksContainer: ViewStyle = {
  flexDirection: "row",
  marginBottom: spacing.md,
}

const $streakBox: ViewStyle = {
  flex: 1,
  alignItems: "center",
}

const $streakHeader: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: spacing.xxs,
}

const $streakEmoji: ThemedStyle<TextStyle> = () => ({
  fontSize: 16,
  marginRight: spacing.xxs,
})

const $streakLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 12,
  fontFamily: typography.primary.medium,
})

const $streakValue: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontSize: 24,
  fontFamily: typography.primary.bold,
})

const $divider: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 1,
  height: "100%",
  backgroundColor: colors.separator,
})

const $statusSection: ThemedStyle<ViewStyle> = () => ({
  marginBottom: spacing.sm,
  paddingHorizontal: spacing.xxs,
})

const $statusContent: ViewStyle = {
  gap: spacing.xxs,
}

const $timerRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
}

const $timerInfo: ViewStyle = {
  alignItems: "center",
  flex: 1,
}

const $timerValue: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 18,
  color: colors.tint,
  fontFamily: typography.primary.medium,
  marginTop: spacing.xxs,
})

const $timerLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.textDim,
  fontFamily: typography.primary.medium,
})

const $xpInfo: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontSize: 16,
  fontFamily: typography.primary.medium,
})

const $bonusInfo: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 14,
  fontFamily: typography.primary.medium,
})

const $lastCheckIn: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  color: colors.textDim,
  textAlign: "right",
  marginTop: spacing.xxs,
})

const $lostStreakText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.error,
})

const $lostStreakWarning: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.error,
  fontSize: 11,
  textAlign: "center",
})

const $errorContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  marginTop: spacing.xs,
  padding: spacing.xs,
  backgroundColor: colors.errorBackground,
  borderRadius: spacing.xxs,
})

const $errorIcon: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.error,
  marginRight: spacing.xs,
})

const $errorText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.error,
  fontSize: 12,
  fontFamily: typography.primary.medium,
})

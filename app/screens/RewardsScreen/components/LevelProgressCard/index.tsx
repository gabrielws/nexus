import { FC } from "react"
import { View, ViewStyle, TextStyle } from "react-native"
import { Text } from "@/components"
import { spacing, typography } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import type { ThemedStyle } from "@/theme"
import { ProgressBar } from "./ProgressBar"
import { observer } from "mobx-react-lite"
import { useStores } from "@/models"

export const LevelProgressCard: FC = observer(function LevelProgressCard() {
  const { userStore } = useStores()
  const { themed } = useAppTheme()

  const { profile } = userStore
  const nextLevel = userStore.nextLevelInfo
  const currentLevel = userStore.currentLevelInfo

  if (!profile || !currentLevel) return null

  return (
    <View style={themed($container)}>
      {/* Cabeçalho com Nível e XP */}
      <View style={$header}>
        <View style={$levelContainer}>
          <View style={themed($levelBadge)}>
            <Text text={profile.current_level.toString()} style={themed($levelNumber)} />
          </View>
          <View style={$levelInfo}>
            <Text preset="bold" text={currentLevel.title} style={themed($title)} />
            <Text
              text={currentLevel.description || ""}
              style={themed($subtitle)}
              numberOfLines={1}
            />
          </View>
        </View>
        <View style={$xpInfo}>
          <Text text="XP TOTAL" preset="formLabel" style={themed($xpLabel)} />
          <Text text={profile.current_xp.toString()} style={themed($xpValue)} />
        </View>
      </View>

      {/* Barra de Progresso e Próximo Nível */}
      <View style={$progressSection}>
        <View style={$progressContainer}>
          <ProgressBar progress={userStore.progressPercentage} />
          <View style={$progressLabels}>
            <Text text={`${profile.current_xp} XP`} style={themed($progressStart)} />
            <Text
              text={`${nextLevel?.xp_required ?? currentLevel.xp_required} XP`}
              style={themed($progressEnd)}
            />
          </View>
        </View>

        {nextLevel && (
          <View style={themed($nextLevelInfo)}>
            <Text text={`Próximo: ${nextLevel.title}`} style={themed($nextLevelTitle)} />
            <Text text={`Faltam ${userStore.xpToNextLevel} XP`} style={themed($xpToGo)} />
          </View>
        )}
      </View>
    </View>
  )
})

const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
  borderRadius: spacing.sm,
  padding: spacing.md,
  elevation: 4,
})

const $header: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: spacing.sm,
}

const $levelContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  flex: 1,
  marginRight: spacing.sm,
}

const $levelBadge: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: colors.tint,
  justifyContent: "center",
  alignItems: "center",
  marginRight: spacing.xs,
})

const $levelNumber: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.background,
  fontSize: 18,
  fontFamily: typography.primary.bold,
})

const $levelInfo: ViewStyle = {
  flex: 1,
  justifyContent: "center",
}

const $title: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 16,
})

const $subtitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 12,
})

const $xpInfo: ViewStyle = {
  alignItems: "flex-end",
}

const $xpLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 10,
  marginBottom: spacing.xxs,
})

const $xpValue: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontSize: 18,
  fontFamily: typography.primary.bold,
})

const $progressSection: ViewStyle = {
  gap: spacing.xs,
}

const $progressContainer: ViewStyle = {
  gap: spacing.xxs,
}

const $progressLabels: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
}

const $progressStart: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 11,
})

const $progressEnd: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 11,
})

const $nextLevelInfo: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingTop: spacing.xs,
  borderTopWidth: 1,
  borderTopColor: colors.separator,
})

const $nextLevelTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 12,
})

const $xpToGo: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontSize: 12,
  fontFamily: typography.primary.medium,
})

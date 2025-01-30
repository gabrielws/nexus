import { FC } from "react"
import { View, ViewStyle, TextStyle, ImageStyle } from "react-native"
import { observer } from "mobx-react-lite"
import { Text } from "@/components"
import { spacing, typography, ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { UserStore } from "@/models"
import {
  achievementIconRegistry,
  AchievementIconTypes,
} from "@/services/achievements/achievementIcons"
import { Image } from "expo-image"

interface AchievementCardProps {
  achievement: UserStore["achievements"][0]
}

export const AchievementCard: FC<AchievementCardProps> = observer(function AchievementCard({
  achievement,
}) {
  const { themed } = useAppTheme()
  const completed = !!achievement.completed_at

  return (
    <View style={themed($container)}>
      <View style={$mainContent}>
        {/* Lado Esquerdo - Ícone */}
        <View style={[themed($iconContainer), !completed && themed($iconContainerLocked)]}>
          <Image
            source={
              achievementIconRegistry[achievement.icon as AchievementIconTypes] ||
              achievementIconRegistry.selo
            }
            style={$icon}
            contentFit="contain"
          />
        </View>

        {/* Conteúdo Central - Título e Descrição */}
        <View style={$centerContent}>
          <Text
            text={achievement.title}
            style={[themed($title), !completed && themed($textLocked)]}
            numberOfLines={1}
          />
          <Text
            text={achievement.description}
            style={[themed($description), !completed && themed($textLocked)]}
            numberOfLines={2}
          />
          <View style={$progressContainer}>
            <View style={themed($progressBar)}>
              <View
                style={[themed($progressBarFill), { width: `${achievement.progress_percentage}%` }]}
              />
            </View>
            <Text
              text={`${achievement.current_progress}/${achievement.requirement}`}
              style={themed($progress)}
            />
          </View>
        </View>

        {/* Lado Direito - XP */}
        <View style={$rightContent}>
          <Text text={`+${achievement.xp_reward}`} style={themed($xpValue)} />
          <Text text="XP" style={themed($xpLabel)} />
        </View>
      </View>
    </View>
  )
})

const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  marginTop: spacing.xxs,
  backgroundColor: colors.background,
  borderRadius: spacing.sm,
  padding: spacing.md,
  elevation: 4,
  // marginBottom: spacing.xs,
})

const $mainContent: ViewStyle = {
  flexDirection: "row",
  alignItems: "flex-start",
}

const $iconContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: colors.tint,
  justifyContent: "center",
  alignItems: "center",
  marginRight: spacing.sm,
})

const $iconContainerLocked: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.tintInactive,
})

const $icon: ImageStyle = {
  width: 24,
  height: 24,
}

const $centerContent: ViewStyle = {
  flex: 1,
  marginRight: spacing.sm,
}

const $rightContent: ViewStyle = {
  alignItems: "flex-end",
}

const $title: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 16,
  fontWeight: "600",
  marginBottom: spacing.xxs,
})

const $textLocked: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $description: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 13,
  lineHeight: 16,
  marginBottom: spacing.sm,
})

const $progressContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
}

const $progressBar: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  height: 4,
  backgroundColor: colors.tintInactive,
  borderRadius: 2,
  overflow: "hidden",
})

const $progressBarFill: ThemedStyle<ViewStyle> = ({ colors }) => ({
  height: "100%",
  backgroundColor: colors.tint,
  borderRadius: 2,
})

const $progress: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 12,
})

const $xpValue: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontSize: 18,
  fontFamily: typography.primary.medium,
})

const $xpLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 12,
})

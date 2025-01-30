import { FC } from "react"
import { observer } from "mobx-react-lite"
import { View, ViewStyle } from "react-native"
import { spacing } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { UserAvatar, UserInfo } from "."

export interface LevelConfig {
  level: number
  title: string
  minXp: number
  maxXp: number
}

export interface ProfileHeaderProps {
  username?: string
  email?: string
  levelConfig?: LevelConfig
  currentXp?: number
  xpToNext?: number
}

export const ProfileHeader: FC<ProfileHeaderProps> = observer(function ProfileHeader({
  username,
  email,
  levelConfig,
  currentXp = 0,
  xpToNext = 0,
}) {
  const { themed } = useAppTheme()

  return (
    <View style={themed($profileSection)}>
      <View style={$headerContent}>
        <View style={$avatarSection}>
          <UserAvatar
            username={username}
            level={levelConfig?.level}
            currentXp={currentXp}
            xpToNext={xpToNext}
          />
        </View>

        <UserInfo username={username} email={email} levelTitle={levelConfig?.title} />
      </View>
    </View>
  )
})

const $profileSection: ViewStyle = {
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
}

const $headerContent: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.md,
}

const $avatarSection: ViewStyle = {
  alignItems: "center",
}

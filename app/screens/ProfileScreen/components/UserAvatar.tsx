import { FC } from "react"
import { observer } from "mobx-react-lite"
import { View, Image, ViewStyle, ImageStyle, TextStyle } from "react-native"
import { Text } from "@/components"
import { ThemedStyle, typography } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { ProgressRing } from "."

interface UserAvatarProps {
  username?: string
  level?: number
  currentXp?: number
  xpToNext?: number
}

export const UserAvatar: FC<UserAvatarProps> = observer(function UserAvatar({
  username,
  level = 1,
  currentXp = 0,
  xpToNext = 0,
}) {
  const { themed } = useAppTheme()
  const progress = xpToNext > 0 ? (currentXp / xpToNext) * 100 : 0

  return (
    <View style={$avatarWrapper}>
      <ProgressRing progress={progress} />
      <View style={themed($avatarContainer)}>
        <Image
          source={{
            uri: `https://api.dicebear.com/9.x/avataaars-neutral/png?seed=${username}`,
          }}
          style={$avatar}
        />
        <View style={themed($levelBadge)}>
          <Text text={`${level}`} preset="bold" style={themed($levelText)} />
        </View>
      </View>
    </View>
  )
})

const $avatarWrapper: ViewStyle = {
  position: "relative",
  width: 96,
  height: 96,
  justifyContent: "center",
  alignItems: "center",
}

const $avatarContainer: ViewStyle = {
  position: "absolute",
  width: 84,
  height: 84,
  borderRadius: 42,
  padding: 3,
}

const $avatar: ImageStyle = {
  width: "100%",
  height: "100%",
  borderRadius: 41,
}

const $levelBadge: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: "absolute",
  bottom: -4,
  right: -4,
  borderRadius: 12,
  backgroundColor: colors.tint,
  color: colors.text,
  width: 24,
  height: 24,
  justifyContent: "center",
  alignItems: "center",
})

const $levelText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  fontFamily: typography.primary.medium,
  color: colors.background,
})

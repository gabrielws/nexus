import { FC } from "react"
import { observer } from "mobx-react-lite"
import { View, ViewStyle, TextStyle } from "react-native"
import { Text } from "@/components"
import { spacing } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { useStores } from "@/models"

interface UserInfoProps {
  username?: string
  email?: string
  levelTitle?: string
}

export const UserInfo: FC<UserInfoProps> = observer(function UserInfo({
  username,
  email,
  levelTitle,
}) {
  const { themed } = useAppTheme()
  const { userStore } = useStores()

  return (
    <View style={$profileInfo}>
      {/* Nome e Nível */}
      <View style={$mainInfoContainer}>
        <View style={$titleContainer}>
          <Text
            text={username || "Carregando..."}
            preset="heading"
            style={themed($username)}
            numberOfLines={1}
          />
          {levelTitle && <Text text={levelTitle} preset="formHelper" style={themed($levelTitle)} />}
        </View>
      </View>

      {/* Informações Secundárias */}
      <View style={$secondaryInfoContainer}>
        {email && <Text text={email} preset="formHelper" style={$emailText} numberOfLines={1} />}
        <Text
          text={`Entrou em ${
            userStore.profile?.created_at
              ? new Date(userStore.profile.created_at).toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric",
                })
              : "..."
          }`}
          preset="formHelper"
          style={themed($joinedText)}
          numberOfLines={1}
        />
      </View>
    </View>
  )
})

const $profileInfo: ViewStyle = {
  justifyContent: "center",
  flex: 1,
  minWidth: 0,
  gap: spacing.xs,
}

const $mainInfoContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
}

const $titleContainer: ViewStyle = {
  flex: 1,
  marginRight: spacing.xs,
}

const $username: TextStyle = {
  marginBottom: spacing.xxxs,
}

const $levelTitle: TextStyle = {
  fontSize: 14,
}

const $secondaryInfoContainer: ViewStyle = {
  minWidth: 0,
}

const $emailText: TextStyle = {
  marginBottom: spacing.xxs,
}

const $joinedText: TextStyle = {
  opacity: 0.7,
}

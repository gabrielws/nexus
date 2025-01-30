import { FC, useState } from "react"
import { observer } from "mobx-react-lite"
import { ViewStyle, View, RefreshControl, TextStyle } from "react-native"
import { AppStackScreenProps } from "@/navigators"
import { Screen, Header } from "@/components"
import { spacing } from "@/theme"
import { useStores } from "@/models"
import { useAppTheme } from "@/utils/useAppTheme"
import type { ThemedStyle } from "@/theme"
import { useAuth } from "@/services/auth/useAuth"
import { DailyCheckIn } from "./DailyCheckIn"
import { XpAnimation } from "@/components"
import { REWARDS_CONFIG } from "@/config/rewards"
import { LevelProgressCard } from "./components/LevelProgressCard"
import { AchievementsList } from "./components/AchievementsList"
// eslint-disable-next-line no-restricted-imports, @typescript-eslint/no-unused-vars
import React from "react"

interface RewardsScreenProps extends AppStackScreenProps<"Rewards"> {}

export const RewardsScreen: FC<RewardsScreenProps> = observer(function RewardsScreen() {
  const { userStore } = useStores()
  const { themed, theme } = useAppTheme()
  const { session } = useAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [showXpAnimation, setShowXpAnimation] = useState(false)
  const [calculatedXp, setCalculatedXp] = useState(REWARDS_CONFIG.CHECK_IN.BASE_XP)

  const onRefresh = async () => {
    setRefreshing(true)
    if (session?.user?.id) {
      await userStore.fetchUserProfile(session.user.id)
    }
    setRefreshing(false)
  }

  return (
    <>
      {/* Animação de XP */}
      {showXpAnimation && (
        <View style={$xpAnimationContainer}>
          <XpAnimation xp={calculatedXp} onAnimationComplete={() => setShowXpAnimation(false)} />
        </View>
      )}
      <Screen
        preset="scroll"
        style={themed($screenContainer)}
        ScrollViewProps={{
          refreshControl: (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.tint]}
              progressBackgroundColor={theme.colors.background}
            />
          ),
        }}
      >
        <Header title="Recompensas" titleStyle={themed($headerTitle)} />

        {/* Seção: Progresso do Nível */}
        <View style={themed($section)}>
          <LevelProgressCard />
        </View>

        {/* Seção: Check-in Diário */}
        <View style={themed($section)}>
          <DailyCheckIn
            onXpCalculated={setCalculatedXp}
            onCheckInSuccess={(xp) => {
              setShowXpAnimation(true)
              setCalculatedXp(xp)
            }}
          />
        </View>

        {/* Seção: Conquistas */}
        <View style={themed($section)}>
          <AchievementsList />
        </View>

        {/* Seção: Missões Diárias */}
        {/* <View style={themed($section)}>
          <View style={$sectionHeader}>
            <Text preset="heading" text="Missões Diárias" style={themed($sectionTitle)} />
          </View>
        </View> */}

        {/* Seção: Histórico de Recompensas */}
        {/* <View style={themed($section)}>
          <View style={$sectionHeader}>
            <Text preset="heading" text="Histórico" style={themed($sectionTitle)} />
          </View>
        </View> */}
      </Screen>
    </>
  )
})

const $screenContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.background,
})

const $headerTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
})

const $section: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
})

const $xpAnimationContainer: ViewStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
  pointerEvents: "none",
}

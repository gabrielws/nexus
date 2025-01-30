import { FC, useEffect, useState } from "react"
import { observer } from "mobx-react-lite"
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  View,
  ViewStyle,
  TextStyle,
} from "react-native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { AppStackParamList } from "@/navigators"
import { Screen, Text, Header } from "@/components"
import { spacing } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { useStores } from "@/models"
import { ProfileHeader } from "../ProfileScreen/components/ProfileHeader"

interface UserProfile {
  id: string
  username: string
  avatar_url: string | null
  current_xp: number
  current_level: number
  current_streak: number
  max_streak: number
  last_check_in: string | null
  problems_reported: number
  problems_solved: number
  created_at: string
  updated_at: string
}

export const ViewProfileScreen: FC<NativeStackScreenProps<AppStackParamList, "ViewProfile">> =
  observer(function ViewProfileScreen({ route, navigation }) {
    const { themed } = useAppTheme()
    const { userStore } = useStores()
    const [refreshing, setRefreshing] = useState(false)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const { userId } = route.params

    const fetchProfile = async () => {
      try {
        setLoading(true)
        const data = await userStore.fetchUserProfileById(userId)
        console.log("📱 [ViewProfile] Dados recebidos:", data)
        setProfile(data)
      } catch (error) {
        console.error("❌ [ViewProfile] Erro ao buscar perfil:", error)
      } finally {
        setLoading(false)
      }
    }

    useEffect(() => {
      fetchProfile()
    }, [userId])

    const onRefresh = async () => {
      setRefreshing(true)
      await fetchProfile()
      setRefreshing(false)
    }

    if (loading) {
      return (
        <Screen preset="fixed" safeAreaEdges={["top"]}>
          <Header title="Perfil" leftIcon="caretLeft" onLeftPress={() => navigation.goBack()} />
          <View style={$screenContainer}>
            <ActivityIndicator size="large" />
          </View>
        </Screen>
      )
    }

    if (!profile) {
      return (
        <Screen preset="fixed" safeAreaEdges={["top"]}>
          <Header title="Perfil" leftIcon="caretLeft" onLeftPress={() => navigation.goBack()} />
          <View style={$screenContainer}>
            <Text text="Perfil não encontrado" />
          </View>
        </Screen>
      )
    }

    console.log("📱 [ViewProfile] Renderizando perfil:", {
      username: profile.username,
      problems_reported: profile.problems_reported,
      problems_solved: profile.problems_solved,
    })

    const currentLevelInfo = userStore.getLevelInfo?.(profile.current_level)
    const nextLevelInfo = userStore.getLevelInfo?.(profile.current_level + 1)
    const xpForNextLevel = nextLevelInfo?.xp_required ?? 0
    const currentLevelXp = currentLevelInfo?.xp_required ?? 0
    const xpProgress = profile.current_xp - currentLevelXp
    const xpNeeded = xpForNextLevel - currentLevelXp

    return (
      <Screen preset="fixed" safeAreaEdges={["top"]}>
        <Header title="Perfil" leftIcon="caretLeft" onLeftPress={() => navigation.goBack()} />
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={$contentContainer}
        >
          <View style={themed($container)}>
            <ProfileHeader
              username={profile.username}
              levelConfig={{
                level: profile.current_level,
                title: currentLevelInfo?.title ?? "",
                minXp: currentLevelXp,
                maxXp: xpForNextLevel,
              }}
              currentXp={xpProgress}
              xpToNext={xpNeeded}
            />

            {/* Estatísticas */}
            <View style={$statsContainer}>
              <Text text="Estatísticas" preset="heading" style={$statsHeading} />
              <View style={$statsGrid}>
                <View style={$statItem}>
                  <Text text={profile.current_xp.toString()} preset="heading" />
                  <Text text="XP Total" preset="formHelper" />
                </View>
                <View style={$statItem}>
                  <Text text={profile.current_level.toString()} preset="heading" />
                  <Text text="Nível" preset="formHelper" />
                </View>
                <View style={$statItem}>
                  <Text text={profile.problems_reported.toString()} preset="heading" />
                  <Text text="Problemas Reportados" preset="formHelper" />
                </View>
                <View style={$statItem}>
                  <Text text={profile.problems_solved.toString()} preset="heading" />
                  <Text text="Problemas Resolvidos" preset="formHelper" />
                </View>
                <View style={$statItem}>
                  <Text text={profile.current_streak.toString()} preset="heading" />
                  <Text text="Dias Seguidos" preset="formHelper" />
                </View>
                <View style={$statItem}>
                  <Text text={profile.max_streak.toString()} preset="heading" />
                  <Text text="Recorde de Dias" preset="formHelper" />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </Screen>
    )
  })

const $screenContainer: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
}

const $contentContainer: ViewStyle = {
  flexGrow: 1,
}

const $container: ViewStyle = {
  flex: 1,
  paddingTop: spacing.lg,
}

const $statsContainer: ViewStyle = {
  padding: spacing.md,
}

const $statsHeading: TextStyle = {
  marginBottom: spacing.sm,
}

const $statsGrid: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.sm,
}

const $statItem: ViewStyle = {
  flex: 1,
  minWidth: "45%",
  backgroundColor: "rgba(0,0,0,0.05)",
  padding: spacing.sm,
  borderRadius: 8,
  alignItems: "center",
}

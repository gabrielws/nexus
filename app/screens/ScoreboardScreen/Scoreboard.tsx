import { FC, useEffect } from "react"
import { observer } from "mobx-react-lite"
import {
  ViewStyle,
  View,
  TextStyle,
  FlatList,
  Image,
  ImageStyle,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native"
import { AppStackScreenProps } from "@/navigators"
import { Header, Screen, Text } from "@/components"
import { spacing } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import FontAwesome6 from "@expo/vector-icons/FontAwesome6"
import { useStores } from "@/models"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"

// Tipos
interface RankUser {
  id: string
  username: string
  avatar_url: string | null
  current_xp: number
  current_level: number
  problems_reported: number
  problems_solved: number
}

interface UserRankCardProps {
  user: RankUser
  index: number
}

// Componente para o card de cada usuário no ranking
const UserRankCard: FC<UserRankCardProps> = observer(function UserRankCard({ user, index }) {
  const { theme } = useAppTheme()
  const navigation = useNavigation<NativeStackNavigationProp<any>>()
  const isTopThree = index < 3

  // Função para retornar o ícone da medalha baseado na posição
  const getMedalIcon = (position: number) => {
    switch (position) {
      case 0:
        return "trophy"
      case 1:
        return "medal"
      case 2:
        return "award"
      default:
        return null
    }
  }

  const handlePress = () => {
    navigation.navigate("ViewProfile", { userId: user.id })
  }

  return (
    <TouchableOpacity
      style={[$rankCard, { backgroundColor: theme.colors.background }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Posição e Medalha */}
      <View style={$rankPosition}>
        {isTopThree ? (
          <FontAwesome6
            name={getMedalIcon(index)}
            size={24}
            color={index === 0 ? "#FFD700" : index === 1 ? "#C0C0C0" : "#CD7F32"}
          />
        ) : (
          <Text text={`${index + 1}º`} style={$rankText} />
        )}
      </View>

      {/* Avatar */}
      <Image
        source={{
          uri:
            user.avatar_url ||
            `https://api.dicebear.com/9.x/avataaars-neutral/png?seed=${user.username}`,
        }}
        style={$avatar}
      />

      {/* Informações do Usuário */}
      <View style={$userInfo}>
        <Text text={user.username} preset="bold" style={{ color: theme.colors.text }} />
        <Text
          text={`Nível ${user.current_level} • ${user.current_xp} XP`}
          preset="formHelper"
          style={{ color: theme.colors.textDim }}
        />
      </View>

      {/* Estatísticas */}
      <View style={$stats}>
        <View style={$statsRow}>
          <FontAwesome6 name="flag" size={12} color={theme.colors.textDim} style={$statsIcon} />
          <Text
            text={`${user.problems_reported}`}
            preset="formHelper"
            style={{ color: theme.colors.textDim }}
          />
        </View>
        <View style={$statsRow}>
          <FontAwesome6 name="check" size={12} color={theme.colors.textDim} style={$statsIcon} />
          <Text
            text={`${user.problems_solved}`}
            preset="formHelper"
            style={{ color: theme.colors.textDim }}
          />
        </View>
      </View>
    </TouchableOpacity>
  )
})

interface ScoreboardScreenProps extends AppStackScreenProps<"Scoreboard"> {}

export const ScoreboardScreen: FC<ScoreboardScreenProps> = observer(function ScoreboardScreen() {
  const { theme } = useAppTheme()
  const { userStore } = useStores()

  // Busca o ranking ao montar o componente
  useEffect(() => {
    userStore.fetchRanking()
  }, [])

  return (
    <Screen
      preset="fixed"
      contentContainerStyle={[$screenContainer, { backgroundColor: theme.colors.background }]}
    >
      <Header title="Ranking" />

      <FlatList
        data={userStore.rankingUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <UserRankCard user={item} index={index} />}
        contentContainerStyle={$listContent}
        showsVerticalScrollIndicator={false}
        refreshing={userStore.isLoading}
        onRefresh={() => userStore.fetchRanking()}
        ListEmptyComponent={
          userStore.isLoading ? (
            <View style={$loading}>
              <ActivityIndicator size="large" color={theme.colors.tint} />
            </View>
          ) : (
            <View style={$empty}>
              <Text
                text="Nenhum usuário encontrado"
                preset="subheading"
                style={{ color: theme.colors.textDim }}
              />
            </View>
          )
        }
      />
    </Screen>
  )
})

// Estilos
const $screenContainer: ViewStyle = {
  flex: 1,
}

const $listContent: ViewStyle = {
  paddingBottom: spacing.lg,
  gap: spacing.sm,
  paddingHorizontal: spacing.md,
}

const $rankCard: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  padding: spacing.sm,
  borderRadius: 12,
}

const $rankPosition: ViewStyle = {
  width: 40,
  alignItems: "center",
  justifyContent: "center",
}

const $rankText: TextStyle = {
  fontSize: 16,
}

const $avatar: ImageStyle = {
  width: 40,
  height: 40,
  borderRadius: 20,
  marginRight: spacing.sm,
}

const $userInfo: ViewStyle = {
  flex: 1,
  marginRight: spacing.sm,
}

const $stats: ViewStyle = {
  alignItems: "flex-end",
  minWidth: 60,
}

const $statsRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
}

const $statsIcon: ViewStyle = {
  width: 14,
}

const $loading: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingTop: spacing.xl,
}

const $empty: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingTop: spacing.xl,
}

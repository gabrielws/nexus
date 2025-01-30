import { FC, useEffect, useState, memo, useCallback } from "react"
import { observer } from "mobx-react-lite"
import {
  ViewStyle,
  View,
  TextStyle,
  Image,
  ImageStyle,
  ScrollView,
  RefreshControl,
  Dimensions,
} from "react-native"
import { AppStackScreenProps } from "@/navigators"
import { Screen, Text, Header } from "@/components"
import { spacing, typography, colors } from "@/theme"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useStores } from "@/models"
import { useAuth } from "app/services/auth/useAuth"
import Svg, { Circle } from "react-native-svg"
import { useAppTheme } from "@/utils/useAppTheme"
import type { ThemedStyle } from "@/theme"
// eslint-disable-next-line no-restricted-imports, @typescript-eslint/no-unused-vars
import React from "react"
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
} from "react-native-reanimated"
import { LinearGradient } from "expo-linear-gradient"
import {
  achievementIconRegistry,
  AchievementIconTypes,
} from "@/services/achievements/achievementIcons"
import { TouchableOpacity } from "react-native-gesture-handler"

// Constantes para o carrossel
const SLIDE_WIDTH = Dimensions.get("window").width

// Array de cores para os cards
const CARD_COLORS = [
  [colors.colorA1, colors.colorA2],
  [colors.colorB1, colors.colorB2],
  [colors.colorC1, colors.colorC2],
  [colors.colorD1, colors.colorD2],
  [colors.colorE1, colors.colorE2],
  [colors.colorF1, colors.colorF2],
]

// Constantes otimizadas para o carrossel
const SLIDE_CONFIG = {
  width: SLIDE_WIDTH,
  itemsPerSlide: 4,
  spacing: spacing.sm,
  offset: spacing.md,
  animationConfig: {
    damping: 20,
    stiffness: 100,
    mass: 0.5,
  },
} as const

// Componente para exibir informações do usuário
interface UserInfoProps {
  username?: string
  email?: string
  levelTitle?: string
  currentXp?: number
  xpToNext?: number
}

const UserInfo: FC<UserInfoProps> = ({ username, email, levelTitle }) => {
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
        <Text text={email || ""} preset="formHelper" style={$emailText} numberOfLines={1} />
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
}

// Componente para o anel de progresso
interface ProgressRingProps {
  progress: number
}

const ProgressRing: FC<ProgressRingProps> = ({ progress }) => {
  const { theme } = useAppTheme()
  return (
    <View style={$progressRing}>
      <Svg width={96} height={96}>
        {/* Círculo de fundo */}
        <Circle
          cx={48}
          cy={48}
          r={44}
          stroke={theme.colors.separator}
          strokeWidth={6}
          fill="none"
        />
        {/* Círculo de progresso */}
        <Circle
          cx={48}
          cy={48}
          r={44}
          stroke={theme.colors.tint}
          strokeWidth={6}
          fill="none"
          strokeDasharray={`${2 * Math.PI * 44}`}
          strokeDashoffset={2 * Math.PI * 44 * (1 - progress / 100)}
          transform={`rotate(-90 48 48)`}
        />
      </Svg>
    </View>
  )
}

// Componente para o avatar do usuário
interface UserAvatarProps {
  avatarUrl?: string
  level?: number
  progress: number
}

const UserAvatar: FC<UserAvatarProps> = ({ avatarUrl, level = 1, progress }) => {
  const { themed } = useAppTheme()
  const { userStore } = useStores()

  return (
    <View style={$avatarWrapper}>
      <ProgressRing progress={progress} />
      <View style={themed($avatarContainer)}>
        <Image
          source={{
            uri:
              avatarUrl ||
              `https://api.dicebear.com/9.x/avataaars-neutral/png?seed=${userStore.profile?.username}`,
          }}
          style={$avatar}
        />
        <View style={themed($levelBadge)}>
          <Text text={`${level}`} preset="bold" style={themed($levelText)} />
        </View>
      </View>
    </View>
  )
}

interface LevelConfig {
  level: number
  xp_required: number
  title: string
  description: string | null
  created_at: string | null
}

interface ProfileHeaderProps {
  profile?: {
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
  email?: string
  progressPercentage: number
  currentLevelInfo?: LevelConfig
  nextLevelInfo?: LevelConfig
}

const ProfileHeader = observer(
  ({ profile, email, progressPercentage, currentLevelInfo, nextLevelInfo }: ProfileHeaderProps) => {
    const { themed } = useAppTheme()
    const { userStore } = useStores()

    const handleDebugAddXP = useCallback(() => {
      userStore.debugAddXP()
    }, [userStore])

    return (
      <View style={themed($profileSection)}>
        <View style={$profileHeaderContent}>
          <View style={$avatarSection}>
            <UserAvatar
              avatarUrl={profile?.avatar_url ?? undefined}
              level={profile?.current_level}
              progress={progressPercentage}
            />
            {__DEV__ && (
              <TouchableOpacity onPress={handleDebugAddXP} style={themed($debugButton)}>
                <Text text="DEBUG: +XP" style={themed($debugButtonText)} />
              </TouchableOpacity>
            )}
          </View>
          <View style={$infoSection}>
            <UserInfo
              username={profile?.username}
              email={email}
              levelTitle={currentLevelInfo?.title}
              currentXp={profile?.current_xp}
              xpToNext={
                nextLevelInfo?.xp_required
                  ? nextLevelInfo.xp_required - (profile?.current_xp ?? 0)
                  : undefined
              }
            />
          </View>
        </View>
      </View>
    )
  },
)

interface ProfileScreenProps extends AppStackScreenProps<"Profile"> {}

export const ProfileScreen: FC<ProfileScreenProps> = observer(function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>()
  const { userStore, upvoteStore, commentStore } = useStores()
  const { session } = useAuth()
  const { themed, theme } = useAppTheme()
  const [refreshing, setRefreshing] = useState(false)
  const [achievements, setAchievements] = useState<any[]>([])
  const [upvotesReceived, setUpvotesReceived] = useState(0)
  const scrollX = useSharedValue(0)

  const onRefresh = useCallback(async () => {
    if (!session?.user?.id) return
    setRefreshing(true)
    try {
      await userStore.fetchUserProfile(session.user.id)
      await upvoteStore.fetchReceivedUpvotesCount(session.user.id).then(setUpvotesReceived)
    } finally {
      setRefreshing(false)
    }
  }, [session?.user?.id, userStore, upvoteStore])

  // Carrega o perfil inicial
  useEffect(() => {
    if (!session?.user?.id) return

    const setupStores = async () => {
      try {
        await userStore.setup()
        await upvoteStore.fetchUpvotesByProblem(session.user.id)
        await upvoteStore.fetchReceivedUpvotesCount(session.user.id).then(setUpvotesReceived)
      } catch (error) {
        console.error("Erro ao configurar stores:", error)
      }
    }

    setupStores()
  }, [session?.user?.id, userStore, upvoteStore])

  // Atualiza achievements quando mudarem no store
  useEffect(() => {
    setAchievements(userStore.achievements)
  }, [userStore.achievements])

  // Converte null para undefined para compatibilidade de tipos
  const profile = userStore.profile || undefined

  // Calculando total de upvotes dados usando as views
  const upvotesGiven = upvoteStore.getUserUpvotesCount(session?.user?.id || "")

  // Calculando total de comentários feitos e recebidos
  const commentsGiven = commentStore.comments.filter(
    (comment) => comment.userId === session?.user?.id,
  ).length
  const commentsReceived = commentStore.comments.filter(
    (comment) => comment.problemId && (profile?.problems_reported ?? 0) > 0,
  ).length

  // Preparando dados para o carrossel de estatísticas
  const statsData = [
    {
      topRow: [
        { value: profile?.current_xp || 0, label: "XP Total" },
        { value: profile?.max_streak || 0, label: "Recorde de Dias" },
      ],
      bottomRow: [
        { value: profile?.current_level || 1, label: "Nível" },
        {
          value: achievements.filter((a) => a.completed_at).length,
          label: "Conquistas",
        },
      ],
    },
    {
      topRow: [
        { value: profile?.problems_reported || 0, label: "Reportados" },
        { value: profile?.problems_solved || 0, label: "Resolvidos" },
      ],
      bottomRow: [
        {
          value: `${upvotesReceived} / ${upvotesGiven}`,
          label: "Upvotes R/D",
        },
        {
          value: `${commentsReceived} / ${commentsGiven}`,
          label: "Comentários R/D",
        },
      ],
    },
  ]

  return (
    <ScrollView
      style={themed($container)}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.tint]}
          progressBackgroundColor={theme.colors.background}
        />
      }
    >
      <Screen preset="scroll" style={themed($screenContainer)}>
        <Header
          title="Perfil"
          rightIcon="settings"
          onRightPress={() => navigation.getParent()?.navigate("Settings")}
          titleStyle={themed($headerTitle)}
        />

        <ProfileHeader
          profile={profile}
          email={session?.user?.new_email || session?.user?.email}
          progressPercentage={userStore.progressPercentage}
          currentLevelInfo={userStore.currentLevelInfo}
          nextLevelInfo={userStore.nextLevelInfo}
        />

        {/* Estatísticas */}
        <View style={themed($statsSection)}>
          <StatsCarousel data={statsData} scrollX={scrollX} />
          <View style={$paginationContainer}>
            {Array(2)
              .fill(0)
              .map((_, index) => (
                <PaginationDot key={index} index={index} scrollX={scrollX} />
              ))}
          </View>
        </View>

        {/* Lista de Conquistas */}
        <View style={themed($achievementsSection)}>
          <View style={$sectionHeader}>
            <Text preset="formLabel" text="CONQUISTAS" style={themed($sectionTitle)} />
            <Text
              preset="formHelper"
              text={`${achievements.filter((a) => a.completed_at).length} de ${achievements.length}`}
              style={themed($achievementCount)}
            />
          </View>
          <View style={$achievementsList}>
            {achievements
              .filter((achievement) => achievement.completed_at)
              .map((achievement) => (
                <View
                  key={achievement.id}
                  style={[
                    themed($achievementItem),
                    !achievement.completed_at && $achievementLocked,
                  ]}
                >
                  <View
                    style={[
                      themed($achievementIconContainer),
                      !achievement.completed_at && themed($achievementIconLocked),
                    ]}
                  >
                    <Image
                      source={
                        achievementIconRegistry[achievement.icon as AchievementIconTypes] ||
                        achievementIconRegistry.selo
                      }
                      style={[$achievementIcon, !achievement.completed_at && $achievementIconDim]}
                    />
                  </View>
                  <View style={$achievementContent}>
                    <View style={$achievementMainInfo}>
                      <Text
                        text={achievement.title}
                        style={[
                          themed($achievementTitle),
                          !achievement.completed_at && themed($achievementTextLocked),
                        ]}
                      />
                      <Text
                        text={achievement.description}
                        style={[
                          themed($achievementDescription),
                          !achievement.completed_at && themed($achievementTextLocked),
                        ]}
                      />
                    </View>
                    <View style={$achievementReward}>
                      <Text
                        text={`+${achievement.xp_reward}`}
                        style={[
                          themed($achievementXP),
                          !achievement.completed_at && themed($achievementTextLocked),
                        ]}
                      />
                      <Text
                        text="XP"
                        style={[
                          themed($xpLabel),
                          !achievement.completed_at && themed($achievementTextLocked),
                        ]}
                      />
                    </View>
                  </View>
                </View>
              ))}
          </View>
        </View>

        {/* Debug: Todas as Conquistas */}
        {__DEV__ && (
          <View style={themed($achievementsSection)}>
            <View style={$sectionHeader}>
              <Text
                preset="formLabel"
                text="DEBUG: TODAS AS CONQUISTAS"
                style={themed($sectionTitle)}
              />
              <Text
                preset="formHelper"
                text={`${achievements.length} total`}
                style={themed($achievementCount)}
              />
            </View>
            <View style={$achievementsList}>
              {achievements.map((achievement) => (
                <View
                  key={achievement.id}
                  style={[
                    themed($achievementItem),
                    !achievement.completed_at && $achievementLocked,
                  ]}
                >
                  <View
                    style={[
                      themed($achievementIconContainer),
                      !achievement.completed_at && themed($achievementIconLocked),
                    ]}
                  >
                    <Image
                      source={
                        achievementIconRegistry[achievement.icon as AchievementIconTypes] ||
                        achievementIconRegistry.selo
                      }
                      style={[$achievementIcon, !achievement.completed_at && $achievementIconDim]}
                    />
                  </View>
                  <View style={$achievementContent}>
                    <View style={$achievementMainInfo}>
                      <Text
                        text={achievement.title}
                        style={[
                          themed($achievementTitle),
                          !achievement.completed_at && themed($achievementTextLocked),
                        ]}
                      />
                      <Text
                        text={achievement.description}
                        style={[
                          themed($achievementDescription),
                          !achievement.completed_at && themed($achievementTextLocked),
                        ]}
                      />
                      <Text
                        text={`Progresso: ${achievement.current_progress}/${achievement.requirement} (${achievement.progress_percentage.toFixed(1)}%)`}
                        style={[
                          themed($achievementDebugText),
                          !achievement.completed_at && themed($achievementTextLocked),
                        ]}
                      />
                      <Text
                        text={`Categoria: ${achievement.category}`}
                        style={[
                          themed($achievementDebugText),
                          !achievement.completed_at && themed($achievementTextLocked),
                        ]}
                      />
                      {achievement.completed_at && (
                        <Text
                          text={`Completado em: ${new Date(achievement.completed_at).toLocaleString("pt-BR")}`}
                          style={[
                            themed($achievementDebugText),
                            !achievement.completed_at && themed($achievementTextLocked),
                          ]}
                        />
                      )}
                    </View>
                    <View style={$achievementReward}>
                      <Text
                        text={`+${achievement.xp_reward}`}
                        style={[
                          themed($achievementXP),
                          !achievement.completed_at && themed($achievementTextLocked),
                        ]}
                      />
                      <Text
                        text="XP"
                        style={[
                          themed($xpLabel),
                          !achievement.completed_at && themed($achievementTextLocked),
                        ]}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </Screen>
    </ScrollView>
  )
})

const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.background,
})

const $screenContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.background,
})

const $headerTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
})

const $profileSection: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
  padding: spacing.md,
})

const $profileHeaderContent: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
}

const $avatarSection: ViewStyle = {
  marginRight: spacing.md,
}

const $infoSection: ViewStyle = {
  flex: 1,
}

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

const $username: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  marginBottom: spacing.xxxs,
})

const $levelTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontSize: 14,
})

const $secondaryInfoContainer: ViewStyle = {
  minWidth: 0,
}

const $emailText: TextStyle = {
  marginBottom: spacing.xxs,
}

const $joinedText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $statsSection: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
  paddingVertical: spacing.md,
  marginBottom: spacing.sm,
})

const $scrollViewContent: ViewStyle = {
  // Removido padding horizontal para slides ocuparem largura total
}

const $slideContainer: ViewStyle = {
  width: SLIDE_CONFIG.width,
  gap: SLIDE_CONFIG.spacing,
  paddingHorizontal: SLIDE_CONFIG.offset,
  paddingBottom: spacing.md,
}

const $cardsRow: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
}

const $cardContainer: ViewStyle = {
  width: (SLIDE_CONFIG.width - SLIDE_CONFIG.offset * 2 - SLIDE_CONFIG.spacing) / 2,
  borderRadius: 16,
  elevation: 10,
  overflow: "hidden",
}

const $gradient: ViewStyle = {
  flex: 1,
  borderRadius: 16,
  padding: spacing.md,
  justifyContent: "space-between",
}

const $statContent: ViewStyle = {
  flex: 1,
  alignItems: "flex-start",
  justifyContent: "space-between",
}

const $statNumber: TextStyle = {
  fontSize: 32,
  lineHeight: 36,
  fontFamily: typography.primary.bold,
  color: "white",
  textShadowColor: "rgba(0, 0, 0, 0.15)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 2,
}

const $statLabel: TextStyle = {
  fontSize: 13,
  color: "rgba(255, 255, 255, 0.9)",
  fontFamily: typography.primary.medium,
  textTransform: "uppercase",
  letterSpacing: 1,
  marginTop: spacing.xs,
  textShadowColor: "rgba(0, 0, 0, 0.15)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 2,
}

const $achievementsSection: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
  padding: spacing.md,
})

const $sectionHeader: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.sm,
  paddingHorizontal: spacing.md,
}

const $sectionTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
})

const $achievementCount: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $achievementsList: ViewStyle = {
  gap: spacing.sm,
}

const $achievementItem: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.background,
  borderRadius: 12,
  padding: spacing.sm,
})

const $achievementIconContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: colors.background,
  alignItems: "center",
  justifyContent: "center",
  marginRight: spacing.sm,
})

const $achievementContent: ViewStyle = {
  flex: 1,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  gap: spacing.xs,
}

const $achievementMainInfo: ViewStyle = {
  flex: 1,
}

const $achievementTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  fontFamily: typography.primary.medium,
  color: colors.text,
  marginBottom: 2,
})

const $achievementDescription: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 13,
  color: colors.textDim,
  fontFamily: typography.primary.normal,
})

const $achievementReward: ViewStyle = {
  alignItems: "center",
  minWidth: 50,
}

const $achievementXP: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  fontFamily: typography.primary.bold,
  color: colors.tint,
})

const $xpLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  fontFamily: typography.primary.medium,
  color: colors.textDim,
})

const $achievementLocked: ViewStyle = {
  opacity: 0.5,
}

const $achievementIconLocked: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.separator,
})

const $achievementTextLocked: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $progressRing: ViewStyle = {
  position: "absolute",
  width: 96,
  height: 96,
}

const $avatarWrapper: ViewStyle = {
  position: "relative",
  width: 96,
  height: 96,
  justifyContent: "center",
  alignItems: "center",
}

const $avatarContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: "absolute",
  width: 84,
  height: 84,
  borderRadius: 42,
  backgroundColor: colors.background,
  padding: 3,
})

const $avatar: ImageStyle = {
  width: "100%",
  height: "100%",
  borderRadius: 41,
}

const $levelBadge: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: "absolute",
  bottom: -4,
  right: -4,
  backgroundColor: colors.tint,
  borderRadius: 12,
  width: 24,
  height: 24,
  justifyContent: "center",
  alignItems: "center",
})

const $levelText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.background,
  fontSize: 12,
  fontFamily: typography.primary.bold,
})

// Interfaces para o carrossel
interface StatCardProps {
  value: string | number
  label: string
  index: number
  scrollX: Animated.SharedValue<number>
}

interface StatCardData {
  value: string | number
  label: string
}

interface SlideData {
  topRow: StatCardData[]
  bottomRow: StatCardData[]
}

interface StatsCarouselProps {
  data: SlideData[]
  scrollX: Animated.SharedValue<number>
}

// Componente otimizado do carrossel
const StatsCarousel: React.FC<StatsCarouselProps> = memo(function StatsCarousel({ data, scrollX }) {
  const renderSlide = useCallback(
    ({ item: slideData, index: slideIndex }: { item: SlideData; index: number }) => {
      return (
        <View key={slideIndex} style={$slideContainer}>
          <View style={$cardsRow}>
            {slideData.topRow.map((item: StatCardData, index: number) => (
              <StatCard
                key={`${slideIndex}-top-${index}`}
                {...item}
                index={slideIndex * SLIDE_CONFIG.itemsPerSlide + index}
                scrollX={scrollX}
              />
            ))}
          </View>
          <View style={$cardsRow}>
            {slideData.bottomRow.map((item: StatCardData, index: number) => (
              <StatCard
                key={`${slideIndex}-bottom-${index}`}
                {...item}
                index={slideIndex * SLIDE_CONFIG.itemsPerSlide + index + 2}
                scrollX={scrollX}
              />
            ))}
          </View>
        </View>
      )
    },
    [scrollX],
  )

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x
    },
  })

  return (
    <Animated.FlatList
      horizontal
      data={data}
      renderItem={renderSlide}
      keyExtractor={(_, index) => `slide-${index}`}
      showsHorizontalScrollIndicator={false}
      snapToInterval={SLIDE_CONFIG.width}
      decelerationRate="fast"
      scrollEventThrottle={16}
      pagingEnabled
      onScroll={scrollHandler}
      getItemLayout={(_, index) => ({
        length: SLIDE_CONFIG.width,
        offset: SLIDE_CONFIG.width * index,
        index,
      })}
      initialNumToRender={2}
      maxToRenderPerBatch={2}
      windowSize={3}
      removeClippedSubviews
      contentContainerStyle={$scrollViewContent}
    />
  )
})

const $paginationContainer: ViewStyle = {
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  marginTop: spacing.xs,
}

const $paginationDot: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 12,
  height: 5,
  borderRadius: 5,
  backgroundColor: colors.text,
  marginHorizontal: spacing.xxs,
})

// Componente para o dot de paginação
interface PaginationDotProps {
  index: number
  scrollX: Animated.SharedValue<number>
}

const PaginationDot: React.FC<PaginationDotProps> = memo(({ index, scrollX }) => {
  const { themed } = useAppTheme()
  const inputRange = [
    (index - 1) * SLIDE_CONFIG.width,
    index * SLIDE_CONFIG.width,
    (index + 1) * SLIDE_CONFIG.width,
  ]

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, inputRange, [0.5, 1, 0.5], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    width: interpolate(scrollX.value, inputRange, [5, 12, 5], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  }))

  return <Animated.View style={[themed($paginationDot), animatedStyle]} />
})

PaginationDot.displayName = "PaginationDot"

const $achievementIcon: ImageStyle = {
  width: 32,
  height: 32,
  resizeMode: "contain",
}

const $achievementIconDim: ImageStyle = {
  opacity: 0.5,
}

// Componente otimizado do StatCard
const StatCard = memo(({ value, label, index, scrollX }: StatCardProps) => {
  const { themed } = useAppTheme()
  const colorIndex = index % CARD_COLORS.length
  const [startColor, endColor] = CARD_COLORS[colorIndex]

  const slideIndex = Math.floor(index / SLIDE_CONFIG.itemsPerSlide)
  const inputRange = [
    (slideIndex - 1) * SLIDE_CONFIG.width,
    slideIndex * SLIDE_CONFIG.width,
    (slideIndex + 1) * SLIDE_CONFIG.width,
  ]

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(scrollX.value, inputRange, [0.95, 1, 0.95], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
    const opacity = interpolate(scrollX.value, inputRange, [0.8, 1, 0.8], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })

    return {
      transform: [{ scale }],
      opacity,
    }
  })

  return (
    <Animated.View style={[themed($cardContainer), animatedStyle]}>
      <LinearGradient
        colors={[startColor, endColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={$gradient}
      >
        <View style={$statContent}>
          <Text text={value.toString()} preset="subheading" style={$statNumber} />
          <Text text={label} preset="default" style={$statLabel} />
        </View>
      </LinearGradient>
    </Animated.View>
  )
})

StatCard.displayName = "StatCard"

const $achievementDebugText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 12,
  lineHeight: 16,
  marginTop: spacing.xxs,
  fontFamily: typography.primary.medium,
})

// Estilos para o botão de debug
const $debugButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.error,
  padding: spacing.xs,
  borderRadius: spacing.xs,
  marginTop: spacing.xs,
  alignSelf: "center",
})

const $debugButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.background,
  fontSize: 12,
  fontFamily: typography.primary.medium,
})

import type { FC } from 'react'
import { observer } from 'mobx-react-lite'
import { RefreshControl, View } from 'react-native'
import type { TextStyle, ViewStyle } from 'react-native'
import { useCallback, useEffect, useState } from 'react'
import { Card } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Button, Header, Screen, Text } from '@/components'
import { useAuth } from '@/services/auth/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useAppTheme } from '@/utils/useAppTheme'
import { REWARDS_CONFIG } from '@/config/rewards'
import { spacing } from '@/theme/spacing'
import type { AppStackScreenProps } from '@/navigators'
import { LevelItem } from './RewardsScreen/LevelItem'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { FeedbackModal } from '@/components/FeedbackModal'
import { FEEDBACK_CONFIG } from '@/config/feedback'
import { useFeedback } from '@/hooks/useFeedback'
import { XPAnimation } from '@/components/XPAnimation'

interface RewardsScreenProps extends AppStackScreenProps<'Rewards'> {}

export const RewardsScreen: FC<RewardsScreenProps> = observer(() => {
  const { user } = useAuth()
  const { profile, checkIn, error, refetchProfile, stats } = useProfile(user?.id)
  const {
    theme: { colors },
  } = useAppTheme()
  const [refreshing, setRefreshing] = useState(false)
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [showXPAnimation, setShowXPAnimation] = useState(false)
  const [earnedXP, setEarnedXP] = useState(0)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackXP, setFeedbackXP] = useState(0)
  const { currentQuestion, submitResponse, isComplete, totalQuestions, currentQuestionIndex } = useFeedback(user?.id)

  const canCheckIn = (() => {
    if (!profile?.last_check_in)
      return true

    const lastCheckIn = new Date(profile.last_check_in)
    const now = new Date()
    const hoursSinceLastCheckIn = (now.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60)

    return hoursSinceLastCheckIn >= REWARDS_CONFIG.CHECK_IN.HOURS_TO_RESET
  })()

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refetchProfile()
    }
    finally {
      setRefreshing(false)
    }
  }, [refetchProfile])

  const $root: ViewStyle = {
    flex: 1,
    backgroundColor: colors.background,
  }

  const $container: ViewStyle = {
    padding: spacing.sm,
  }

  const $card: ViewStyle = {
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.separator,
  }

  const $cardTitle: TextStyle = {
    marginVertical: spacing.xs,
    color: colors.text,
    fontWeight: 'bold',
  }

  const $cardSubtitle: TextStyle = {
    marginBottom: 20,
    color: colors.textDim,
    fontSize: 14,
  }

  const $streakContainer: ViewStyle = {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  }

  const $streakRow: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  }

  const $streakItem: ViewStyle = {
    flex: 1,
    alignItems: 'center',
  }

  const $streakLabel: TextStyle = {
    fontSize: 12,
    color: colors.textDim,
    marginBottom: 2,
  }

  const $streakValue: TextStyle = {
    fontSize: 16,
    color: colors.text,
    fontWeight: 'bold',
  }

  const $divider: ViewStyle = {
    width: 1,
    height: '100%',
    backgroundColor: colors.separator,
    marginHorizontal: spacing.xs,
  }

  const $lastCheckIn: TextStyle = {
    fontSize: 12,
    color: colors.textDim,
    textAlign: 'center',
    marginBottom: 4,
  }

  const $xpInfo: TextStyle = {
    color: colors.tint,
    textAlign: 'center',
    marginBottom: 4,
    fontSize: 14,
  }

  const $checkInButton: ViewStyle = {
    alignItems: 'center',
    marginTop: 4,
  }

  const $button: ViewStyle = {
    width: '80%',
    paddingVertical: 6,
  }

  const $errorText: TextStyle = {
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.xs,
  }

  useEffect(() => {
    const updateTimeLeft = () => {
      if (!profile?.last_check_in || canCheckIn)
        return

      const lastCheckIn = new Date(profile.last_check_in)
      const nextCheckIn = new Date(lastCheckIn.getTime() + (REWARDS_CONFIG.CHECK_IN.HOURS_TO_RESET * 60 * 60 * 1000))
      const now = new Date()
      const diff = nextCheckIn.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft('')
        refetchProfile().catch(() => {})
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      )
    }

    const timer = setInterval(updateTimeLeft, 1000)
    updateTimeLeft()
    return () => clearInterval(timer)
  }, [profile?.last_check_in, canCheckIn, refetchProfile])

  const handleCheckIn = async () => {
    try {
      await checkIn()
      const xp = calculateCheckInXP(profile?.current_streak ?? 0)
      setEarnedXP(xp)
      setShowXPAnimation(true)
      setTimeout(() => {
        setShowXPAnimation(false)
      }, 2000)
    }
    catch {
      // O erro já é tratado no hook useProfile
    }
  }

  const calculateCheckInXP = (streak: number): number => {
    if (streak <= 0)
      return REWARDS_CONFIG.CHECK_IN.BASE_XP

    const streakBonus = Math.floor(
      REWARDS_CONFIG.CHECK_IN.BASE_XP
      * REWARDS_CONFIG.CHECK_IN.STREAK_MULTIPLIER
      * streak,
    )
    return REWARDS_CONFIG.CHECK_IN.BASE_XP + streakBonus
  }

  const expectedXP = calculateCheckInXP(profile?.current_streak ?? 0)

  const $rootContainer: ViewStyle = {
    flex: 1,
    backgroundColor: colors.background,
  }

  const handleFeedbackSubmit = async (rating: number) => {
    try {
      await submitResponse(rating)
      setFeedbackXP((prev) => {
        const newXP = prev + FEEDBACK_CONFIG.XP_REWARD
        return newXP
      })

      if (isComplete) {
        setShowFeedbackModal(false)
        const totalXP = feedbackXP + FEEDBACK_CONFIG.XP_REWARD
        setEarnedXP(totalXP)
        setShowXPAnimation(true)
        setTimeout(() => {
          setShowXPAnimation(false)
          setFeedbackXP(0)
        }, 2000)
      }
    }
    catch (error) {
      console.error('Erro ao enviar feedback:', error)
    }
  }

  const handleCloseModal = () => {
    setShowFeedbackModal(false)
    if (feedbackXP > 0) {
      setEarnedXP(feedbackXP)
      setShowXPAnimation(true)
      setTimeout(() => {
        setShowXPAnimation(false)
        setFeedbackXP(0)
      }, 2000)
    }
  }

  return (
    <View style={$rootContainer}>
      <Screen
        style={$root}
        preset="scroll"
        safeAreaEdges={['top', 'bottom']}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.tint]}
            tintColor={colors.tint}
          />
        )}
      >
        <Header
          title="Recompensas"
          titleMode="center"
          backgroundColor={colors.background}
          containerStyle={$container as ViewStyle}
        />

        <View style={$container}>
          {/* Seção de Check-in */}
          <Card style={$card}>
            <Card.Title
              title="Check-in Diário"
              subtitle="Faça check-in todos os dias para ganhar XP"
              subtitleNumberOfLines={2}
              titleStyle={$cardTitle}
              subtitleStyle={$cardSubtitle}
              left={props => <MaterialCommunityIcons name="calendar-check" size={props.size} color={colors.tint} />}
            />
            <Card.Content>
              <View style={$streakContainer}>
                <View style={$streakRow}>
                  <View style={$streakItem}>
                    <Text style={$streakLabel}>Sequência atual</Text>
                    <Text style={$streakValue}>
                      {profile?.current_streak ?? 0}
                      {' '}
                      dias
                    </Text>
                  </View>
                  <View style={$divider} />
                  <View style={$streakItem}>
                    <Text style={$streakLabel}>Maior sequência</Text>
                    <Text style={$streakValue}>
                      {profile?.max_streak ?? 0}
                      {' '}
                      dias
                    </Text>
                  </View>
                </View>

                {profile?.last_check_in && (
                  <Text style={$lastCheckIn}>
                    Último check-in:
                    {' '}
                    {format(new Date(profile.last_check_in), 'dd \'de\' MMMM', { locale: ptBR })}
                  </Text>
                )}

                <Text style={$xpInfo}>
                  {canCheckIn
                    ? `Ganhe ${expectedXP} XP hoje!`
                    : timeLeft
                      ? `Próximo check-in em ${timeLeft}`
                      : 'Calculando tempo restante...'}
                  {(profile?.current_streak ?? 0) > 0 ? ` (+${Math.floor(REWARDS_CONFIG.CHECK_IN.BASE_XP * REWARDS_CONFIG.CHECK_IN.STREAK_MULTIPLIER * (profile?.current_streak ?? 0))} bônus por sequência)` : ''}
                </Text>

                <View style={$checkInButton}>
                  <Button
                    preset="filled"
                    onPress={handleCheckIn}
                    disabled={!canCheckIn}
                    style={$button}
                    text={canCheckIn ? 'Fazer Check-in' : 'Check-in realizado'}
                  />
                </View>

                {error && (
                  <Text style={$errorText}>{error.message}</Text>
                )}
              </View>
            </Card.Content>
          </Card>

          {/* Seção de Feedback */}
          {currentQuestion && (
            <Card style={$card}>
              <Card.Title
                title="Ganhe mais recompensas!"
                subtitle="Responda uma pergunta rápida e ganhe XP"
                subtitleNumberOfLines={2}
                titleStyle={$cardTitle}
                subtitleStyle={$cardSubtitle}
                left={props => (
                  <MaterialCommunityIcons
                    name="gift"
                    size={props.size}
                    color={colors.tint}
                  />
                )}
              />
              <Card.Content>
                <View style={$streakContainer}>
                  <Text style={$xpInfo}>
                    Ganhe
                    {' '}
                    {FEEDBACK_CONFIG.XP_REWARD}
                    {' '}
                    XP respondendo uma pergunta rápida!
                  </Text>
                  <View style={$checkInButton}>
                    <Button
                      preset="filled"
                      text="Responder Agora"
                      onPress={() => setShowFeedbackModal(true)}
                      style={$button}
                    />
                  </View>
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Seção de Níveis */}
          <Card style={$card}>
            <Card.Title
              title="Níveis e Recompensas"
              subtitle="Desbloqueie recompensas subindo de nível"
              subtitleNumberOfLines={2}
              titleStyle={$cardTitle}
              subtitleStyle={$cardSubtitle}
              left={props => <MaterialCommunityIcons name="trophy" size={props.size} color={colors.tint} />}
            />
            <Card.Content>
              {REWARDS_CONFIG.LEVELS.map(level => (
                <LevelItem
                  key={level.level}
                  level={level.level}
                  title={level.title}
                  description={level.description}
                  xpRequired={level.xp_required}
                  rewards={level.rewards}
                  isUnlocked={(profile?.current_level ?? 0) >= level.level}
                  isCurrentLevel={profile?.current_level === level.level}
                  progress={level.level === profile?.current_level
                    ? (stats?.progress_to_next_level ?? 0) / 100
                    : undefined}
                />
              ))}
            </Card.Content>
          </Card>
        </View>
      </Screen>

      <FeedbackModal
        visible={showFeedbackModal}
        onClose={handleCloseModal}
        question={currentQuestion?.question}
        xpReward={FEEDBACK_CONFIG.XP_REWARD}
        onRate={handleFeedbackSubmit}
        currentQuestion={currentQuestionIndex + 1}
        totalQuestions={totalQuestions}
      />

      <XPAnimation
        visible={showXPAnimation}
        xp={earnedXP}
        message={feedbackXP > 0 ? 'Feedback enviado!' : 'Check-in realizado!'}
        onComplete={() => setShowXPAnimation(false)}
      />
    </View>
  )
})

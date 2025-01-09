import { observer } from 'mobx-react-lite'
import React, { useCallback, useEffect, useState } from 'react'
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native'
import { RefreshControl, View } from 'react-native'
import { Button, Header, Screen, Text } from '@/components'
import { Card as PaperCard } from 'react-native-paper'
import { useAuth } from '@/services/auth/useAuth'
import type { ThemedStyle } from '@/theme'
import { colors, spacing } from '@/theme'
import { Image } from 'expo-image'
import type { AppStackScreenProps } from '@/navigators'
import { useAppTheme } from '@/utils/useAppTheme'
import { useProfile } from '@/hooks/useProfile'
import { REWARDS_CONFIG } from '@/config/rewards'
import { BadgeItem } from './BadgeItem'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LevelUpModal } from '../../components/LevelUpModal'
import { supabase } from '@/services/auth/supabase'
import { useLevelUp } from '@/contexts/LevelUpContext'

interface ProfileScreenProps extends AppStackScreenProps<'Profile'> {}

function StatItem({ value, label }: { value: number, label: string }) {
  return (
    <View style={$statItem}>
      <Text preset="bold" style={$statValue} text={value.toString()} />
      <Text preset="formLabel" style={$statLabel} text={label} numberOfLines={2} />
    </View>
  )
}

function getCurrentLevelTitle(level: number) {
  return REWARDS_CONFIG.LEVELS.find(l => l.level === level)?.title ?? 'Iniciante'
}

export const ProfileScreen = observer(({ navigation }: ProfileScreenProps) => {
  const { profile: authProfile, signOut } = useAuth()
  const { profile, stats, refetchProfile } = useProfile(authProfile?.id)
  const {
    theme: { colors },
    themed,
  } = useAppTheme()
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refetchProfile()
    }
    finally {
      setRefreshing(false)
    }
  }, [refetchProfile])

  if (!profile)
    return null

  const progress = {
    current: stats?.total_xp ?? 0,
    next: stats?.next_level_xp ?? 100,
    percentage: stats?.progress_to_next_level ?? 0,
  }

  const earnedBadges = REWARDS_CONFIG.LEVELS
    .filter(level => (profile?.current_level ?? 0) >= level.level)
    .map(level => level.rewards[0]) // Pega o primeiro item que é sempre o emblema

  return (
    <>
      <Screen
        preset="scroll"
        safeAreaEdges={['top', 'bottom']}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.palette.primary400]}
            tintColor={colors.palette.primary400}
          />
        )}
      >
        <Header
          title="Meu Perfil"
          titleMode="center"
          rightIcon="settings"
          backgroundColor={colors.background}
          onRightPress={() => navigation.navigate('Settings')}
          containerStyle={$container as ViewStyle}
        />

        <View style={$container}>
          <View style={$header}>
            <Image
              source={profile.avatar_url ?? require('../../../assets/images/logo.png')}
              style={$avatar}
              contentFit="cover"
            />
            <Text preset="heading" text={profile.username} />
            <View style={$levelBadge}>
              <Text preset="formLabel" style={$levelText}>
                {getCurrentLevelTitle(profile.current_level)}
              </Text>
            </View>
          </View>

          <View style={$stats}>
            <StatItem
              value={stats?.problems_reported ?? 0}
              label="Reportados"
            />
            <StatItem
              value={stats?.problems_solved ?? 0}
              label="Resolvidos"
            />
            <StatItem
              value={stats?.max_streak ?? 0}
              label="Maior Streak"
            />
          </View>

          <View style={$progressContainer}>
            <View style={$progressHeader}>
              <View style={$levelInfo}>
                <Text preset="formLabel" text="Nível" />
                <Text preset="bold" style={$levelNumber}>
                  {profile.current_level}
                </Text>
              </View>
              <View style={$xpInfo}>
                <Text preset="formLabel" text="Progresso" />
                <Text preset="formLabel" text={`${progress.current} / ${progress.next} XP`} />
              </View>
            </View>
            <View style={$progressBar}>
              <View
                style={[
                  $progressFill,
                  { width: `${progress.percentage}%` },
                ]}
              />
            </View>
          </View>

          <Button
            preset="filled"
            onPress={signOut}
            text="Sair"
            style={$logoutButton}
          />

          <PaperCard
            style={themed($card)}
            theme={{
              colors: {
                surfaceVariant: colors.background,
                onSurfaceVariant: colors.text,
              },
            }}
          >
            <PaperCard.Title
              title="Emblemas Conquistados"
              subtitle={`${earnedBadges.length} de ${REWARDS_CONFIG.LEVELS.length}`}
              left={props => <MaterialCommunityIcons name="trophy" size={props.size} color={colors.tint} />}
              titleStyle={themed($cardTitle)}
              subtitleStyle={themed($cardSubtitle)}
            />
            <PaperCard.Content style={themed($cardContent)}>
              <View style={themed($badgesContainer)}>
                {REWARDS_CONFIG.LEVELS
                  .filter(level => (profile?.current_level ?? 0) >= level.level)
                  .map(level => (
                    <BadgeItem
                      key={level.level}
                      title={level.rewards[0]}
                      unlocked
                    />
                  ))}
              </View>
            </PaperCard.Content>
          </PaperCard>
        </View>
      </Screen>
    </>
  )
})

const $container: ViewStyle = {
  flex: 1,
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.lg,
}

const $header: ViewStyle = {
  alignItems: 'center',
  marginBottom: spacing.xl,
}

const $avatar: ImageStyle = {
  width: 120,
  height: 120,
  borderRadius: 60,
  marginBottom: spacing.md,
}

const $levelBadge: ViewStyle = {
  backgroundColor: colors.tint,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.xs,
  borderRadius: 16,
  marginTop: spacing.sm,
}

const $levelText: TextStyle = {
  color: colors.background,
  fontSize: 16,
  fontWeight: 'bold',
}

const $stats: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: spacing.xl,
}

const $statItem: ViewStyle = {
  flex: 1,
  alignItems: 'center',
  paddingHorizontal: spacing.xs,
}

const $statValue: TextStyle = {
  fontSize: 20,
  textAlign: 'center',
}

const $statLabel: TextStyle = {
  fontSize: 14,
  textAlign: 'center',
  marginTop: spacing.xs,
}

const $progressContainer: ViewStyle = {
  marginBottom: spacing.xl,
}

const $progressHeader: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  marginBottom: spacing.xs,
}

const $progressBar: ViewStyle = {
  height: 8,
  backgroundColor: colors.separator,
  borderRadius: 4,
  overflow: 'hidden',
}

const $progressFill: ViewStyle = {
  height: '100%',
  backgroundColor: colors.tint,
  borderRadius: 4,
}

const $logoutButton: ViewStyle = {
  marginTop: spacing.xl,
}

const $card: ThemedStyle<ViewStyle> = ({ colors }) => ({
  marginTop: spacing.lg,
  marginBottom: spacing.lg,
  backgroundColor: colors.background,
  borderWidth: 1,
  borderColor: colors.separator,
  elevation: 0,
  shadowOpacity: 0,
})

const $cardTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 16,
  fontWeight: 'bold',
})

const $cardSubtitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 14,
})

const $cardContent: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
})

const $badgesContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginHorizontal: -spacing.xs,
  backgroundColor: colors.background,
})

const $levelInfo: ViewStyle = {
  alignItems: 'flex-start',
}

const $levelNumber: TextStyle = {
  fontSize: 24,
  color: colors.tint,
  marginTop: spacing.xxs,
}

const $xpInfo: ViewStyle = {
  alignItems: 'flex-end',
}

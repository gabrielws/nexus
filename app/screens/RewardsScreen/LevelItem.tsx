import type { FC } from 'react'
import { View } from 'react-native'
import type { TextStyle, ViewStyle } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { AccordionItem, Text } from '@/components'
import { useAppTheme } from '@/utils/useAppTheme'
import { spacing } from '@/theme/spacing'

interface LevelItemProps {
  level: number
  title: string
  description: string
  xpRequired: number
  rewards: string[]
  isUnlocked: boolean
  isCurrentLevel: boolean
  progress?: number
}

export function LevelItem({
  level,
  title,
  description,
  xpRequired,
  rewards,
  isUnlocked,
  isCurrentLevel,
  progress,
}: LevelItemProps) {
  const { theme: { colors } } = useAppTheme()

  const $levelItem: ViewStyle = {
    backgroundColor: colors.background,
    marginBottom: spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.separator,
  }

  const $currentLevel: ViewStyle = {
    backgroundColor: colors.background,
    borderColor: colors.tint,
    borderWidth: 2,
  }

  const $levelContent: ViewStyle = {
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  }

  const $levelDescription: TextStyle = {
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.xs,
  }

  const $xpRequired: TextStyle = {
    fontSize: 12,
    color: colors.textDim,
    marginBottom: spacing.sm,
  }

  const $rewardsContainer: ViewStyle = {
    marginTop: spacing.xs,
  }

  const $rewardsTitle: TextStyle = {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xxs,
  }

  const $rewardItem: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
  }

  const $rewardText: TextStyle = {
    fontSize: 14,
    color: colors.text,
    marginLeft: spacing.xs,
  }

  const $lockedContent: ViewStyle = {
    alignItems: 'center',
    padding: spacing.md,
  }

  const $lockedText: TextStyle = {
    fontSize: 14,
    color: colors.textDim,
    marginTop: spacing.sm,
    textAlign: 'center',
  }

  const $progressBar: ViewStyle = {
    marginTop: spacing.sm,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.separator,
  }

  const $progressFill: ViewStyle = {
    height: '100%',
    backgroundColor: colors.tint,
    borderRadius: 2,
  }

  return (
    <AccordionItem
      text={`Nível ${level} - ${isUnlocked ? title : '???'}`}
      leftIcon={isUnlocked && !isCurrentLevel ? 'check' : 'lock' as any}
      leftIconColor={colors.textDim}
      style={[
        $levelItem,
        isCurrentLevel && $currentLevel,
      ]}
    >
      <View style={$levelContent}>
        {isUnlocked
          ? (
              <>
                <Text style={$levelDescription}>{description}</Text>
                <Text style={$xpRequired}>
                  XP Necessário:
                  {' '}
                  {xpRequired}
                </Text>
                <View style={$rewardsContainer}>
                  <Text style={$rewardsTitle}>Recompensas:</Text>
                  {rewards.map(reward => (
                    <View key={`${level}-${reward}`} style={$rewardItem}>
                      <MaterialCommunityIcons name="gift" size={16} color={colors.tint} />
                      <Text style={$rewardText}>{reward}</Text>
                    </View>
                  ))}
                </View>
              </>
            )
          : (
              <View style={$lockedContent}>
                <MaterialCommunityIcons name="lock" size={48} color={colors.textDim} />
                <Text style={$lockedText}>
                  Alcance o nível
                  {' '}
                  {level}
                  {' '}
                  para desbloquear
                </Text>
              </View>
            )}
        {progress !== undefined && (
          <View style={$progressBar}>
            <View style={[$progressFill, { width: `${progress * 100}%` }]} />
          </View>
        )}
      </View>
    </AccordionItem>
  )
}

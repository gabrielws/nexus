import React from 'react'
import { Modal, View } from 'react-native'
import type { TextStyle, ViewStyle } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Button, Text } from '@/components'
import { spacing } from '@/theme'
import { useAppTheme } from '@/utils/useAppTheme'
import type { ThemedStyle } from '@/theme'
import { FeedbackSection } from './FeedbackSection'

interface LevelUpModalProps {
  visible: boolean
  newLevel: number
  rewards: string[]
  onClose: () => void
  userId: string
}

export function LevelUpModal({ visible, newLevel, rewards, onClose, userId }: LevelUpModalProps) {
  const { theme: { colors }, themed } = useAppTheme()

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={$overlay}>
        <View style={themed($container)}>
          <View style={$iconContainer}>
            <MaterialCommunityIcons
              name="star-circle"
              size={80}
              color={colors.tint}
            />
          </View>

          <Text style={themed($title)}>
            Nível
            {' '}
            {newLevel}
            !
          </Text>
          <Text style={themed($subtitle)}>
            Parabéns! Você alcançou um novo nível!
          </Text>

          <View style={$rewardsContainer}>
            <Text style={themed($rewardsTitle)}>
              Suas Recompensas
            </Text>
            {rewards.map(reward => (
              <View key={reward} style={$rewardItem}>
                <MaterialCommunityIcons
                  name="gift-outline"
                  size={28}
                  color={colors.tint}
                />
                <Text style={themed($rewardText)}>{reward}</Text>
              </View>
            ))}
          </View>

          <Button
            text="Continuar"
            preset="filled"
            onPress={onClose}
            style={$button}
          />
        </View>
      </View>
    </Modal>
  )
}

const $overlay: ViewStyle = {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.85)',
  justifyContent: 'center',
  alignItems: 'center',
  padding: spacing.sm,
}

const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
  borderRadius: 16,
  padding: spacing.md,
  width: '100%',
  maxWidth: 320,
  alignItems: 'center',
  elevation: 5,
  shadowColor: colors.tint,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
})

const $iconContainer: ViewStyle = {
  marginBottom: spacing.xs,
}

const $title: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontSize: 24,
  fontWeight: 'bold',
  textAlign: 'center',
  marginTop: spacing.xs,
})

const $subtitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 14,
  textAlign: 'center',
  marginTop: spacing.xxs,
  marginBottom: spacing.sm,
})

const $rewardsContainer: ViewStyle = {
  width: '100%',
  marginVertical: spacing.xs,
}

const $rewardsTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: spacing.sm,
  textAlign: 'center',
})

const $rewardItem: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  marginVertical: spacing.xxs,
  backgroundColor: 'rgba(0,0,0,0.05)',
  padding: spacing.xs,
  borderRadius: 6,
}

const $rewardText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 16,
  marginLeft: spacing.sm,
  flex: 1,
})

const $button: ViewStyle = {
  marginTop: spacing.xs,
  marginBottom: spacing.xs,
  minWidth: 140,
}

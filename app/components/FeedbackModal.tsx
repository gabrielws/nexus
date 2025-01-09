import React from 'react'
import { Modal, View } from 'react-native'
import type { TextStyle, ViewStyle } from 'react-native'
import { Button, Text } from '@/components'
import { useAppTheme } from '@/utils/useAppTheme'
import { spacing } from '@/theme'
import { MaterialCommunityIcons } from '@expo/vector-icons'

interface FeedbackModalProps {
  visible: boolean
  onClose: () => void
  question?: string
  xpReward: number
  onRate: (rating: number) => void
  currentQuestion: number
  totalQuestions: number
}

export function FeedbackModal({
  visible,
  onClose,
  question,
  xpReward,
  onRate,
  currentQuestion,
  totalQuestions,
}: FeedbackModalProps) {
  const { theme: { colors } } = useAppTheme()

  if (!question)
    return null

  const $modalOverlay: ViewStyle = {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  }

  const $modalContent: ViewStyle = {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  }

  const $header: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    height: 40,
  }

  const $title: TextStyle = {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.xl,
  }

  const $closeButton: ViewStyle = {
    position: 'absolute',
    right: -spacing.xs,
    top: -spacing.xs,
    padding: spacing.xs,
  }

  const $progress: TextStyle = {
    fontSize: 14,
    color: colors.textDim,
    textAlign: 'center',
    marginBottom: spacing.sm,
  }

  const $progressBar: ViewStyle = {
    height: 4,
    backgroundColor: colors.separator,
    borderRadius: 2,
    marginBottom: spacing.md,
  }

  const $progressFill: ViewStyle = {
    height: '100%',
    width: `${(currentQuestion / totalQuestions) * 100}%`,
    backgroundColor: colors.tint,
    borderRadius: 2,
  }

  const $question: TextStyle = {
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  }

  const $buttonsContainer: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  }

  const $ratingButton: ViewStyle = {
    minWidth: 45,
    height: 45,
    borderRadius: 23,
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
  }

  const $xpText: TextStyle = {
    color: colors.tint,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontSize: 14,
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={$modalOverlay}>
        <View style={$modalContent}>
          <View style={$header}>
            <Text style={$title}>Sua opinião é importante!</Text>
            <Button
              onPress={onClose}
              preset="filled"
              style={$closeButton}
              LeftAccessory={() => (
                <MaterialCommunityIcons name="close" size={24} color={colors.textDim} />
              )}
            />
          </View>

          <Text style={$progress}>
            Pergunta
            {' '}
            {currentQuestion}
            {' '}
            de
            {' '}
            {totalQuestions}
          </Text>
          <View style={$progressBar}>
            <View style={$progressFill} />
          </View>

          <Text style={$question}>{question}</Text>

          <View style={$buttonsContainer}>
            {[1, 2, 3, 4, 5].map(rating => (
              <Button
                key={rating}
                text={rating.toString()}
                preset="default"
                style={$ratingButton}
                textStyle={{ fontSize: 16 }}
                onPress={() => onRate(rating)}
              />
            ))}
          </View>

          <Text style={$xpText}>
            Ganhe
            {' '}
            {xpReward}
            {' '}
            XP ao responder!
            {' '}
            (Total:
            {' '}
            {xpReward * totalQuestions}
            {' '}
            XP)
          </Text>
        </View>
      </View>
    </Modal>
  )
}

import React, { useState } from 'react'
import { Animated, View } from 'react-native'
import type { TextStyle, ViewStyle } from 'react-native'
import { Card as PaperCard } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Button, Text } from '@/components'
import { Colors, spacing } from '@/theme'
import { useAppTheme } from '@/utils/useAppTheme'
import type { ThemedStyle } from '@/theme'

interface FeedbackCardProps {
  question: string
  onRate: (rating: number) => void
  xpReward: number
}

export function FeedbackCard({ question, onRate, xpReward }: FeedbackCardProps) {
  const {
    theme: { colors },
    themed,
  } = useAppTheme()

  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [fadeAnim] = useState(new Animated.Value(1))

  const handleSubmit = async () => {
    if (!selectedRating)
      return

    // Animar fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start()

    // Mostrar mensagem de sucesso
    setShowSuccess(true)

    // Chamar callback após animação
    setTimeout(() => {
      onRate(selectedRating)
    }, 1500)
  }

  if (showSuccess) {
    return (
      <PaperCard style={themed($successCard)}>
        <PaperCard.Content style={$successContent}>
          <MaterialCommunityIcons name="check-circle" size={48} color={colors.tint} />
          <Text style={themed($successText)}>Obrigado pelo feedback!</Text>
          <Text style={themed($rewardText)}>
            +
            {xpReward}
            {' '}
            XP
          </Text>
        </PaperCard.Content>
      </PaperCard>
    )
  }

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <PaperCard style={themed($card)}>
        <PaperCard.Title
          title="Feedback Rápido"
          subtitle={`Responda e ganhe ${xpReward} XP!`}
          left={props => <MaterialCommunityIcons name="comment-question" size={props.size} color={colors.tint} />}
          titleStyle={themed($cardTitle)}
          subtitleStyle={themed($cardSubtitle)}
        />
        <PaperCard.Content>
          <Text style={themed($question)}>{question}</Text>
          <View style={$ratingContainer}>
            {[1, 2, 3, 4, 5].map(rating => (
              <MaterialCommunityIcons
                key={rating}
                name={rating <= (selectedRating ?? 0) ? 'star' : 'star-outline'}
                size={32}
                color={rating <= (selectedRating ?? 0) ? colors.tint : colors.textDim}
                style={$star}
                onPress={() => setSelectedRating(rating)}
              />
            ))}
          </View>
          {selectedRating && (
            <Button
              text="Enviar Feedback"
              preset="filled"
              style={$submitButton}
              onPress={handleSubmit}
            />
          )}
        </PaperCard.Content>
      </PaperCard>
    </Animated.View>
  )
}

const $card: ThemedStyle<ViewStyle> = ({ colors }) => ({
  marginBottom: spacing.xl,
  backgroundColor: colors.background,
  borderWidth: 1,
  borderColor: colors.tint,
  elevation: 0,
  shadowOpacity: 0,
  borderRadius: 12,
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

const $question: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 16,
  textAlign: 'center',
  marginBottom: spacing.md,
})

const $ratingContainer: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  paddingVertical: spacing.sm,
}

const $star: TextStyle = {
  marginHorizontal: spacing.xs,
}

const $submitButton: ViewStyle = {
  marginTop: spacing.md,
}

const $successCard: ThemedStyle<ViewStyle> = ({ colors }) => ({
  marginBottom: spacing.xl,
  backgroundColor: colors.background,
  borderWidth: 1,
  borderColor: colors.tint,
  borderRadius: 12,
})

const $successContent: ViewStyle = {
  alignItems: 'center',
  padding: spacing.lg,
}

const $successText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 18,
  fontWeight: 'bold',
  marginTop: spacing.sm,
})

const $rewardText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontSize: 24,
  fontWeight: 'bold',
  marginTop: spacing.xs,
})

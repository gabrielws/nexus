import React from 'react'
import { View } from 'react-native'
import type { ViewStyle } from 'react-native'
import { spacing } from '@/theme'
import { useFeedback } from '@/hooks/useFeedback'
import { FeedbackCard } from '@/components/FeedbackCard'
import { FEEDBACK_CONFIG } from '@/config/feedback'

interface FeedbackSectionProps {
  userId?: string
  style?: ViewStyle
}

export function FeedbackSection({ userId, style }: FeedbackSectionProps) {
  const { currentQuestion, submitResponse, fetchQuestions } = useFeedback(userId)

  const handleFeedback = async (rating: number) => {
    try {
      await submitResponse(rating)
      await fetchQuestions()
    }
    catch (error) {
      console.error(error)
    }
  }

  if (!currentQuestion)
    return null

  return (
    <View style={[$container, style]}>
      <FeedbackCard
        question={currentQuestion.question}
        xpReward={FEEDBACK_CONFIG.XP_REWARD}
        onRate={handleFeedback}
      />
    </View>
  )
}

const $container: ViewStyle = {
  marginHorizontal: spacing.lg,
  marginVertical: spacing.md,
}

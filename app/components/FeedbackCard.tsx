import React from 'react'
import { View } from 'react-native'
import type { TextStyle, ViewStyle } from 'react-native'
import { Card } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Button, Text } from '@/components'
import { useAppTheme } from '@/utils/useAppTheme'
import { spacing } from '@/theme'

interface FeedbackCardProps {
  question: string
  xpReward: number
  onRate: (rating: number) => void
}

export function FeedbackCard({ question, xpReward, onRate }: FeedbackCardProps) {
  const { theme: { colors } } = useAppTheme()

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
    marginBottom: 0,
    color: colors.textDim,
    fontSize: 14,
  }

  const $buttonsContainer: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.sm,
  }

  const $ratingButton: ViewStyle = {
    minWidth: 50,
    marginHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  }

  const $xpText: TextStyle = {
    color: colors.tint,
    textAlign: 'center',
    marginTop: spacing.xs,
    fontSize: 14,
  }

  return (
    <Card style={$card}>
      <Card.Title
        title="Sua opinião é importante!"
        subtitle="Responda e ganhe XP"
        titleStyle={$cardTitle}
        subtitleStyle={$cardSubtitle}
        left={props => <MaterialCommunityIcons name="star" size={props.size} color={colors.tint} />}
      />
      <Card.Content>
        <Text style={{ color: colors.text, marginBottom: spacing.xs }}>
          {question}
        </Text>
        <View style={$buttonsContainer}>
          {[1, 2, 3, 4, 5].map(rating => (
            <Button
              key={rating}
              text={rating.toString()}
              preset="default"
              style={$ratingButton}
              onPress={() => onRate(rating)}
              textStyle={{ fontSize: 14 }}
            />
          ))}
        </View>
        <Text style={$xpText}>
          Ganhe
          {xpReward}
          {' '}
          XP ao responder!
        </Text>
      </Card.Content>
    </Card>
  )
}

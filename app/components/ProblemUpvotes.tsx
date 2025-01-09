import React, { useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Button, Icon, Text } from '@/components'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { supabase } from '@/services/auth/supabase'
import { useAuth } from '@/services/auth/useAuth'
import { useAppTheme } from '@/utils/useAppTheme'
import type { ThemedStyle } from '@/theme'
import type { TextStyle, ViewStyle } from 'react-native'
import { colors, spacing } from '@/theme'

interface ProblemUpvotesProps {
  problemId: string
  initialCount: number
}

export function ProblemUpvotes({ problemId, initialCount }: ProblemUpvotesProps) {
  const [upvoteCount, setUpvoteCount] = useState(initialCount)
  const [hasUpvoted, setHasUpvoted] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { themed } = useAppTheme()

  useEffect(() => {
    fetchUpvoteData()
  })

  const fetchUpvoteData = async () => {
    if (!problemId)
      return

    // Buscar contagem de upvotes
    const { data: count } = await supabase
      .rpc('get_problem_upvotes', { problem_id: problemId })

    setUpvoteCount(count || 0)

    // Verificar se usuário deu upvote
    if (user) {
      const { data: hasVoted } = await supabase
        .rpc('has_user_upvoted', {
          problem_id: problemId,
          user_id: user.id,
        })

      setHasUpvoted(!!hasVoted)
    }
  }

  const handleUpvote = async () => {
    if (!user || loading)
      return

    setLoading(true)
    try {
      if (hasUpvoted) {
        // Remover upvote
        await supabase
          .from('problem_upvotes')
          .delete()
          .eq('problem_id', problemId)
          .eq('user_id', user.id)

        setUpvoteCount(prev => prev - 1)
        setHasUpvoted(false)
      }
      else {
        // Adicionar upvote
        await supabase
          .from('problem_upvotes')
          .insert({
            problem_id: problemId,
            user_id: user.id,
          })

        setUpvoteCount(prev => prev + 1)
        setHasUpvoted(true)
      }
    }
    catch (error) {
      console.error('Erro ao processar upvote:', error)
    }
    finally {
      setLoading(false)
    }
  }

  return (
    <Pressable
      onPress={handleUpvote}
      disabled={loading || !user}
      style={({ pressed }) => [
        themed($container),
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={themed($content)}>
        <MaterialCommunityIcons
          name="fire"
          size={24}
          color={hasUpvoted ? colors.tint : colors.textDim}
        />
        <Text
          style={[
            themed($count),
            hasUpvoted && themed($activeCount),
          ]}
          weight="medium"
        >
          {upvoteCount}
        </Text>
      </View>
    </Pressable>
  )
}

const $container: ThemedStyle<ViewStyle> = () => ({
  padding: spacing.xs,
})

const $content: ThemedStyle<ViewStyle> = () => ({
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.xxs,
})

const $count: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.textDim,
})

const $activeCount: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
})

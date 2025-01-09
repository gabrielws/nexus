import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native'
import { Avatar, IconButton, TextInput } from 'react-native-paper'
import { Button, Icon, Screen, Text, TextField } from '@/components'
import { supabase } from '@/services/auth/supabase'
import { useAuth } from '@/services/auth/useAuth'
import { useAppTheme } from '@/utils/useAppTheme'
import type { ThemedStyle } from '@/theme'
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native'
import { spacing } from '@/theme'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { ProblemComment } from '@/types/types'
import { MaterialCommunityIcons } from '@expo/vector-icons'

interface ProblemCommentsProps {
  problemId: string
  onInputFocus?: () => void
  onInputBlur?: () => void
}

export function ProblemComments({ problemId, onInputFocus, onInputBlur }: ProblemCommentsProps) {
  const [comments, setComments] = useState<ProblemComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuth()
  const { themed, theme: { colors } } = useAppTheme()

  const fetchComments = useCallback(async () => {
    if (!problemId)
      return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('problem_comments_with_profiles')
        .select('*')
        .eq('problem_id', problemId)
        .order('created_at', { ascending: false })

      if (error)
        throw error

      // Transformar os dados para o formato esperado
      const formattedComments: ProblemComment[] = (data || []).map(comment => ({
        id: comment.id,
        comment: comment.comment,
        created_at: comment.created_at,
        user_id: comment.user_id,
        profiles: {
          username: comment.username,
          avatar_url: comment.avatar_url,
        },
      }))

      setComments(formattedComments)
    }
    catch (error) {
      console.error('Erro ao buscar comentários:', error)
    }
    finally {
      setLoading(false)
    }
  }, [problemId])

  useEffect(() => {
    if (problemId)
      fetchComments()
  }, [problemId, fetchComments])

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim() || submitting || !problemId)
      return

    console.log('Enviando comentário para problema:', problemId)

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('problem_comments')
        .insert({
          problem_id: problemId,
          user_id: user.id,
          comment: newComment.trim(),
        })

      if (error)
        throw error

      setNewComment('')
      await fetchComments()
    }
    catch (error) {
      console.error('Erro ao enviar comentário:', error)
    }
    finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={themed($container)}>
      {/* Input de novo comentário */}
      <View style={themed($inputContainer)}>
        <TextField
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Adicione um comentário..."
          multiline
          maxLength={500}
          style={themed($input)}
          editable
          autoCapitalize="sentences"
          RightAccessory={() => (
            <MaterialCommunityIcons
              name={submitting ? 'loading' : 'send'}
              size={20}
              color={!newComment.trim() || submitting ? colors.textDim : colors.tint}
              onPress={handleSubmitComment}
              style={themed($sendButton)}
            />
          )}
          onFocus={onInputFocus}
          onBlur={onInputBlur}
        />
      </View>

      {/* Lista de comentários */}
      {loading
        ? (
            <ActivityIndicator style={themed($loading)} color={colors.tint} />
          )
        : comments.length > 0
          ? (
              <View style={themed($commentsList)}>
                {comments.map(comment => (
                  <View key={comment.id} style={themed($commentContainer)}>
                    <View style={themed($commentHeader)}>
                      <View style={themed($avatar)}>
                        {comment.profiles.avatar_url
                          ? (
                              <Image
                                source={{ uri: comment.profiles.avatar_url }}
                                style={themed($avatarImage)}
                              />
                            )
                          : (
                              <Icon
                                icon="camera"
                                size={20}
                                color={colors.textDim}
                              />
                            )}
                      </View>
                      <View style={themed($commentInfo)}>
                        <Text style={themed($username)} weight="bold">
                          {comment.profiles.username}
                        </Text>
                        <Text style={themed($timestamp)}>
                          {format(new Date(comment.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </Text>
                      </View>
                    </View>
                    <Text style={themed($commentText)}>{comment.comment}</Text>
                  </View>
                ))}
              </View>
            )
          : (
              <Text
                style={themed($emptyText)}
                size="sm"
                weight="medium"
              >
                Nenhum comentário ainda. Seja o primeiro!
              </Text>
            )}
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = () => ({
  padding: spacing.sm,
})

const $inputContainer: ThemedStyle<ViewStyle> = () => ({
  marginBottom: spacing.sm,
})

const $loading: ThemedStyle<ViewStyle> = () => ({
  padding: spacing.lg,
})

const $commentsList: ThemedStyle<ViewStyle> = () => ({
  gap: spacing.sm,
})

const $commentContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  padding: spacing.sm,
  borderRadius: 8,
  backgroundColor: colors.background,
})

const $commentHeader: ThemedStyle<ViewStyle> = () => ({
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: spacing.xs,
})

const $commentInfo: ThemedStyle<ViewStyle> = () => ({
  marginLeft: spacing.xs,
  flex: 1,
})

const $username: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  fontWeight: '600',
  color: colors.text,
})

const $timestamp: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  color: colors.textDim,
})

const $commentText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.text,
  marginTop: spacing.xs,
})

const $emptyText: ThemedStyle<TextStyle> = ({ colors }) => ({
  textAlign: 'center',
  color: colors.textDim,
  padding: spacing.lg,
})

const $avatar: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: colors.separator,
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
})

const $avatarImage: ThemedStyle<ImageStyle> = () => ({
  width: '100%',
  height: '100%',
})

const $sendButton: ThemedStyle<TextStyle> = () => ({
  padding: spacing.xs,
})

const $input: ThemedStyle<TextStyle> = () => ({
  minHeight: 40,
  maxHeight: 100,
})

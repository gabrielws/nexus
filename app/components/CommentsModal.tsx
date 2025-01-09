import React from 'react'
import { Modal, Pressable, View } from 'react-native'
import { Text } from './Text'
import { ProblemComments } from './ProblemComments'
import type { ThemedStyle } from '@/theme'
import type { TextStyle, ViewStyle } from 'react-native'
import { spacing } from '@/theme'
import { useAppTheme } from '@/utils/useAppTheme'
import { MaterialCommunityIcons } from '@expo/vector-icons'

interface CommentsModalProps {
  visible: boolean
  onClose: () => void
  problemId: string
  commentsCount: number
}

export function CommentsModal({ visible, onClose, problemId, commentsCount }: CommentsModalProps) {
  const { themed, theme: { colors } } = useAppTheme()

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={themed($container)}>
        <View style={themed($header)}>
          <Text style={themed($title)}>
            Comentários (
            {commentsCount}
            )
          </Text>
          <Pressable
            onPress={onClose}
            style={themed($closeButton)}
          >
            <MaterialCommunityIcons
              name="close"
              size={24}
              color={colors.text}
            />
          </Pressable>
        </View>
        <ProblemComments problemId={problemId} />
      </View>
    </Modal>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.background,
  paddingTop: spacing.lg,
})

const $header: ThemedStyle<ViewStyle> = () => ({
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.md,
})

const $title: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 20,
  fontWeight: '600',
  color: colors.text,
})

const $closeButton: ThemedStyle<ViewStyle> = () => ({
  padding: spacing.xs,
})

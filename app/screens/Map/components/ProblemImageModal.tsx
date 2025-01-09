import React from 'react'
import { Image, Modal, Pressable, View } from 'react-native'
import { Icon } from '@/components'
import type { ImageStyle, ViewStyle } from 'react-native'
import type { ThemedStyle } from '@/theme'
import { useAppTheme } from '@/utils/useAppTheme'
import { useSignedUrl } from '@/utils/hooks/useSignedUrl'
import { Image as ExpoImage } from 'expo-image'

interface ProblemImageModalProps {
  imageUrl?: string
  visible: boolean
  onClose: () => void
}

export function ProblemImageModal({ imageUrl, visible, onClose }: ProblemImageModalProps) {
  const { themed } = useAppTheme()
  const signedUrl = useSignedUrl(imageUrl)

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={themed($modalContainer)}>
        <Pressable
          style={themed($closeButton)}
          onPress={onClose}
        >
          <Icon icon="x" size={24} />
        </Pressable>
        {signedUrl && (
          <ExpoImage
            source={{ uri: signedUrl }}
            style={themed($fullImage)}
            contentFit="contain"
            transition={200}
            cachePolicy="memory-disk"
          />
        )}
      </View>
    </Modal>
  )
}

const $modalContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.background,
  justifyContent: 'center',
})

const $closeButton: ThemedStyle<ViewStyle> = () => ({
  position: 'absolute',
  top: 40,
  right: 20,
  zIndex: 1,
  padding: 8,
})

const $fullImage: ThemedStyle<ImageStyle> = () => ({
  width: '100%',
  height: '100%',
})

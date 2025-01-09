import React, { useCallback, useEffect, useState } from 'react'
import { Alert, Image, Pressable, View } from 'react-native'
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { Button, Icon, Text } from '@/components'
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native'
import type { ThemedStyle } from '@/theme'
import { useAppTheme } from '@/utils/useAppTheme'
import type { ProblemFeature } from '../../../types/types'
import { useSignedUrl } from '@/utils/hooks/useSignedUrl'
import { ProblemImageModal } from './ProblemImageModal'
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { useAuth } from '@/services/auth/useAuth'
import { useUsername } from '@/hooks/useUsername'
import { Image as ExpoImage } from 'expo-image'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { spacing } from '@/theme'
import { ProblemComments } from '@/components/ProblemComments'
import { ProblemUpvotes } from '@/components/ProblemUpvotes'
import { CommentsModal } from '@/components/CommentsModal'
import { useCommentCount } from '@/hooks/useCommentCount'

interface ProblemBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheetModal>
  selectedProblem: ProblemFeature | null
  onResolve: () => void
  onClose: () => void
}

export function ProblemBottomSheet({
  bottomSheetRef,
  selectedProblem,
  onResolve,
  onClose,
}: ProblemBottomSheetProps) {
  const { themed, theme: { colors } } = useAppTheme()
  const { user } = useAuth()
  const signedUrl = useSignedUrl(selectedProblem?.properties.image_url || undefined)
  const [imageModalVisible, setImageModalVisible] = useState(false)
  const [isResolving, setIsResolving] = useState(false)
  const reporterUsername = useUsername(selectedProblem?.properties.reporter_id)
  const rotation = useSharedValue(0)
  const [commentsModalVisible, setCommentsModalVisible] = useState(false)
  const { count: commentCount, refetch: refetchComments } = useCommentCount(selectedProblem?.properties.id)

  const canResolve = selectedProblem
    && selectedProblem.properties.reporter_id !== user?.id
    && selectedProblem.properties.status === 'active'

  // const handleClose = useCallback(() => {
  //   bottomSheetRef.current?.dismiss()
  // }, [bottomSheetRef])

  const handleResolve = async () => {
    if (!canResolve)
      return

    setIsResolving(true)
    try {
      await onResolve()
      bottomSheetRef.current?.dismiss()
    }
    catch (error) {
      Alert.alert(
        'Erro',
        error instanceof Error ? error.message : 'Erro ao resolver problema',
      )
    }
    finally {
      setIsResolving(false)
    }
  }

  useEffect(() => {
    if (isResolving) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000 }),
        -1,
        false,
      )
    }
    else {
      rotation.value = 0
    }
  }, [isResolving, rotation])

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }))

  if (!selectedProblem)
    return null

  return (
    <>
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={['90%']}
        index={0}
        enablePanDownToClose
        onDismiss={onClose}
        enableContentPanningGesture
        enableHandlePanningGesture
        handleComponent={() => (
          <View style={themed($handle)}>
            <View style={themed($handleBar)} />
          </View>
        )}
        backgroundStyle={{
          backgroundColor: colors.background,
        }}
      >
        <BottomSheetView style={themed($bottomSheetContent)}>
          <View style={themed($header)}>
            <View style={themed($titleContainer)}>
              <Text
                preset="heading"
                text={selectedProblem.properties.title}
                style={themed($title)}
              />
            </View>
            <View style={themed($headerActions)}>
              <View style={themed($categoryTag)}>
                <Text
                  preset="formHelper"
                  text={selectedProblem.properties.category}
                  style={themed($categoryText)}
                />
              </View>
              <ProblemUpvotes
                problemId={selectedProblem.properties.id}
                initialCount={selectedProblem.properties.upvotes_count ?? 0}
              />
            </View>
          </View>

          <Text
            preset="formLabel"
            text={selectedProblem.properties.description}
            style={themed($problemDescription)}
          />

          {selectedProblem.properties.image_url && (
            <Pressable
              onPress={() => setImageModalVisible(true)}
              style={themed($imageContainer)}
            >
              <ExpoImage
                source={{ uri: signedUrl }}
                style={themed($problemImage)}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
              />
            </Pressable>
          )}

          <View style={themed($metadataContainer)}>
            <Text
              preset="formHelper"
              text={`Reportado por ${reporterUsername}`}
              style={themed($metadataText)}
            />
            <Text
              preset="formHelper"
              text={` • ${new Date(selectedProblem.properties.reported_at).toLocaleDateString()}`}
              style={themed($metadataText)}
            />
          </View>

          <View style={themed($buttonContainer)}>
            {selectedProblem?.properties.status === 'solved'
              ? (
                  <View style={themed($resolvedOverlay)}>
                    <View style={themed($messageOverlay)}>
                      <Text
                        preset="formHelper"
                        text="Este problema já foi resolvido"
                        style={themed($overlayText)}
                      />
                    </View>
                  </View>
                )
              : !canResolve
                  ? (
                      <View style={themed($resolvedOverlay)}>
                        <View style={themed($messageOverlay)}>
                          <Text
                            preset="formHelper"
                            text="Você não pode resolver este problema"
                            style={themed($overlayText)}
                          />
                        </View>
                      </View>
                    )
                  : (
                      <Button
                        text={isResolving ? 'Resolvendo...' : 'Resolver Problema'}
                        preset="reversed"
                        style={themed($resolveButton)}
                        onPress={handleResolve}
                        disabled={isResolving}
                        RightAccessory={() => (
                          <Animated.View style={isResolving ? spinStyle : undefined}>
                            <MaterialCommunityIcons
                              name={isResolving ? 'loading' : 'check-circle-outline'}
                              size={20}
                              style={{ marginLeft: spacing.xs }}
                              color={colors.background}
                            />
                          </Animated.View>
                        )}
                      />
                    )}
          </View>

          <View style={themed($divider)} />

          <View style={themed($socialContainer)}>
            <Button
              preset="default"
              text={`Ver Comentários (${commentCount})`}
              onPress={() => setCommentsModalVisible(true)}
            />
          </View>
        </BottomSheetView>
      </BottomSheetModal>

      <ProblemImageModal
        imageUrl={selectedProblem?.properties.image_url || undefined}
        visible={imageModalVisible}
        onClose={() => setImageModalVisible(false)}
      />

      <CommentsModal
        visible={commentsModalVisible}
        onClose={() => {
          setCommentsModalVisible(false)
          refetchComments()
        }}
        problemId={selectedProblem.properties.id}
        commentsCount={commentCount}
      />
    </>
  )
}

const $bottomSheetContent: ThemedStyle<ViewStyle> = () => ({
  padding: spacing.lg,
  paddingTop: spacing.sm,
})

const $categoryTag: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.tint,
  paddingVertical: spacing.xxs,
  paddingHorizontal: spacing.sm,
  borderRadius: 12,
})

const $categoryText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.background,
  fontSize: 14,
  fontWeight: '600',
  textTransform: 'capitalize',
})

const $problemDescription: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 15,
  lineHeight: 22,
  color: colors.textDim,
  marginBottom: spacing.sm,
})

const $imageContainer: ThemedStyle<ViewStyle> = () => ({
  borderRadius: 12,
  overflow: 'hidden',
  marginBottom: spacing.md,
  height: 180,
})

const $problemImage: ThemedStyle<ImageStyle> = () => ({
  width: '100%',
  height: '100%',
  borderRadius: 12,
})

const $metadataContainer: ThemedStyle<ViewStyle> = () => ({
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: spacing.sm,
})

const $metadataText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 14,
})

const $resolveButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.tint,
  height: 56,
  borderRadius: 12,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: colors.tint,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 4,
})

const $buttonContainer: ThemedStyle<ViewStyle> = () => ({
  position: 'relative',
  marginTop: spacing.md,
})

const $resolvedOverlay: ThemedStyle<ViewStyle> = () => ({
  overflow: 'hidden',
  borderRadius: 8,
  minHeight: 56,
  height: 56,
})

const $messageOverlay: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  padding: spacing.xs,
  backgroundColor: colors.border,
  borderRadius: 8,
})

const $overlayText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.background,
  textAlign: 'center',
  fontSize: 16,
  fontWeight: '500',
})

const $header: ThemedStyle<ViewStyle> = () => ({
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: spacing.md,
  gap: spacing.sm,
})

const $titleContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  justifyContent: 'center',
})

const $headerActions: ThemedStyle<ViewStyle> = () => ({
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.xs,
})

const $title: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 20,
  color: colors.text,
  lineHeight: 24,
  paddingVertical: spacing.xxs,
})

const $socialContainer: ThemedStyle<ViewStyle> = () => ({
  marginTop: spacing.md,
  marginBottom: spacing.sm,
})

const $divider: ThemedStyle<ViewStyle> = ({ colors }) => ({
  height: 1,
  backgroundColor: colors.separator,
  marginVertical: spacing.md,
})

const $handle: ThemedStyle<ViewStyle> = () => ({
  paddingVertical: spacing.xs,
  alignItems: 'center',
})

const $handleBar: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 32,
  height: 4,
  borderRadius: 2,
  backgroundColor: colors.border,
})

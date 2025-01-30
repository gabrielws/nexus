import { FC, useCallback, useMemo, useState, useEffect, useRef } from "react"
import {
  ViewStyle,
  View,
  TextStyle,
  Image,
  ImageStyle,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native"
import { observer } from "mobx-react-lite"
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetBackdropProps,
  BottomSheetTextInput,
  TouchableOpacity,
} from "@gorhom/bottom-sheet"
import { Text, Button } from "@/components"
import { spacing } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import type { ThemedStyle } from "@/theme"
import { CATEGORIES } from "@/components/CategoryPicker"
import ImageView from "react-native-image-viewing"
import { useStores } from "@/models"
import { useAuth } from "@/services/auth/useAuth"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { getSignedImageUrl } from "@/services/supabase/storage"
import { useTranslation } from "react-i18next"

export interface ProblemDetailsSheetProps {
  /**
   * Referência do BottomSheet
   */
  bottomSheetRef: React.RefObject<BottomSheet>
  /**
   * Problema selecionado
   */
  problem: {
    id: string
    title: string
    description: string
    category: string
    status: string
    imageUrl?: string
    reporterId?: string
  } | null
  /**
   * Callback quando o sheet é fechado
   */
  onClose: () => void
  /**
   * Callback para mostrar animação de XP
   */
  onShowXp: () => void
}

export const ProblemDetailsSheet: FC<ProblemDetailsSheetProps> = observer(
  function ProblemDetailsSheet(props) {
    const { bottomSheetRef, problem, onClose, onShowXp } = props
    const [visible, setIsVisible] = useState(false)
    const [newComment, setNewComment] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [signedImageUrl, setSignedImageUrl] = useState<string>()
    const [isImageLoading, setIsImageLoading] = useState(false)
    const [imageError, setImageError] = useState<string>()
    const { themed, theme } = useAppTheme()
    const { problemStore, upvoteStore, commentStore } = useStores()
    const { session } = useAuth()
    const { t } = useTranslation()
    const scrollViewRef = useRef<any>(null)

    // Pontos de snap do sheet (70% e 95% da tela)
    const snapPoints = useMemo(() => ["70%", "95%"], [])

    // Callback quando o sheet é fechado
    const handleSheetChanges = useCallback(
      (index: number) => {
        if (index === -1) {
          onClose()
        }
      },
      [onClose],
    )

    // Renderiza o backdrop com blur
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
      ),
      [],
    )

    // Encontra a categoria do problema
    const category = CATEGORIES.find((c) => c.value === problem?.category)

    // Handler para resolver/reabrir problema
    const handleProblemAction = async () => {
      try {
        // Validações iniciais com logs detalhados
        if (!problem) {
          console.log("❌ Problema não encontrado")
          return
        }
        if (!session?.user?.id) {
          console.log("❌ Usuário não autenticado")
          return
        }

        // Verifica se é o próprio usuário tentando resolver
        if (problem.reporterId === session.user.id) {
          console.log("❌ Usuário tentando resolver seu próprio problema")
          Alert.alert(t("common.error"), t("map:problem.details.actions.error.selfSolve"))
          return
        }

        // Verifica se o problemStore está disponível
        if (!problemStore) {
          console.error("❌ ProblemStore não está disponível")
          return
        }

        // Log detalhado do estado atual
        console.log("🔄 Iniciando ação no problema", {
          problemId: problem.id,
          status: problem.status,
          userId: session.user.id,
          isSubmitting,
          isLoading: problemStore.isLoading,
          problemStore: {
            hasProblems: problemStore.problems.length > 0,
          },
        })

        // Validação extra de estado
        if (isSubmitting || problemStore.isLoading) {
          console.log("⚠️ Ação já em andamento")
          return
        }

        setIsSubmitting(true)

        // Decide qual ação tomar baseado no status do problema
        if (problem.status === "active") {
          // Tenta resolver o problema
          console.log("🔄 Chamando problemStore.solveProblem...")
          await problemStore.solveProblem(problem.id, session.user.id)
          console.log("✅ Problema resolvido com sucesso")

          // Fecha o sheet com animação
          console.log("🔄 Fechando sheet...")
          bottomSheetRef.current?.close()

          // Aguarda o sheet fechar antes de mostrar a animação de XP
          console.log("🔄 Agendando animação de XP...")
          setTimeout(() => {
            console.log("✨ Mostrando animação de XP")
            onShowXp?.()
          }, 300)
        } else if (problem.status === "solved" || problem.status === "invalid") {
          // Tenta reabrir o problema
          console.log("🔄 Chamando problemStore.reopenProblem...")
          await problemStore.reopenProblem(problem.id, session.user.id)
          console.log("✅ Problema reaberto com sucesso")

          // Apenas fecha o sheet, sem animação de XP
          console.log("🔄 Fechando sheet...")
          bottomSheetRef.current?.close()
        }
      } catch (error: any) {
        console.error("❌ Erro ao executar ação:", error)
        Alert.alert(t("common.error"), error.message)
      } finally {
        setIsSubmitting(false)
      }
    }

    // Handler para upvote
    const handleUpvote = async () => {
      if (!problem || !session?.user?.id) {
        console.log("❌ Upvote falhou: problema ou usuário não encontrado", {
          problem,
          userId: session?.user?.id,
        })
        return
      }

      try {
        const hasUserUpvoted = upvoteStore.hasUpvoted(problem.id, session.user.id)
        console.log("🔄 Iniciando upvote:", {
          problemId: problem.id,
          userId: session.user.id,
          hasUpvoted: hasUserUpvoted,
        })

        if (hasUserUpvoted) {
          console.log("🔄 Removendo upvote...")
          await upvoteStore.removeUpvoteByProblem(problem.id)
        } else {
          console.log("🔄 Adicionando upvote...")
          await upvoteStore.addUpvote(problem.id)
        }
        console.log("✅ Operação de upvote concluída com sucesso")
      } catch (error) {
        console.error("❌ Erro ao dar/remover upvote:", error)
      }
    }

    // Verifica se o usuário atual deu upvote
    const hasUpvoted = problem ? upvoteStore.hasUpvoted(problem.id, session?.user?.id) : false

    // Conta total de upvotes
    const upvoteCount = problem ? upvoteStore.getUpvoteCount(problem.id) : 0

    // Log para debug dos estados
    useEffect(() => {
      if (problem) {
        console.log("📊 Estado atual dos upvotes:", {
          problemId: problem.id,
          hasUpvoted,
          upvoteCount,
          userId: session?.user?.id,
        })
      }
    }, [problem, hasUpvoted, upvoteCount, session?.user?.id])

    // Carrega upvotes quando um problema é selecionado
    useEffect(() => {
      if (problem?.id) {
        upvoteStore.fetchUpvotesByProblem(problem.id)
      }
    }, [problem?.id, upvoteStore])

    // Carrega comentários quando um problema é selecionado
    useEffect(() => {
      if (problem?.id) {
        commentStore.fetchCommentsByProblem(problem.id)
      }
    }, [problem?.id, commentStore])

    // Handler para enviar comentário
    const handleSendComment = async () => {
      if (!problem?.id || !newComment.trim() || !session?.user?.id) return

      try {
        await commentStore.createComment(problem.id, newComment.trim())
        setNewComment("") // Limpa o input
      } catch (error) {
        console.error("❌ Erro ao enviar comentário:", error)
      }
    }

    // Atualiza a URL assinada quando o problema muda
    useEffect(() => {
      async function updateSignedUrl() {
        // Limpa a URL anterior imediatamente
        setSignedImageUrl(undefined)

        if (problem?.imageUrl) {
          try {
            console.log("🔄 Atualizando URL assinada para novo problema:", problem.id)
            // A URL completa é algo como: https://xyz.supabase.co/storage/v1/object/public/problem-images/userId/problems/abc.jpg
            // Precisamos extrair a parte após problem-images/
            const match = problem.imageUrl.match(/problem-images\/(.+)/)
            if (!match) {
              console.error("❌ Formato de URL inválido:", problem.imageUrl)
              return
            }
            const path = match[1]
            console.log("🔄 Obtendo URL assinada para:", path)
            const signedUrl = await getSignedImageUrl(path)
            if (signedUrl) {
              setSignedImageUrl(signedUrl)
              console.log("✅ URL assinada atualizada com sucesso")
            } else {
              console.error("❌ Não foi possível obter URL assinada para:", path)
            }
          } catch (error) {
            console.error("❌ Erro ao processar URL da imagem:", error)
          }
        }
      }
      updateSignedUrl()
    }, [problem?.imageUrl, problem?.id])

    // Handler para visualização da imagem
    const handleImagePress = useCallback(() => {
      setIsVisible(true)
    }, [])

    // Handler para carregamento da imagem
    const handleImageLoadStart = useCallback(() => {
      setIsImageLoading(true)
      setImageError(undefined)
    }, [])

    const handleImageLoadSuccess = useCallback(() => {
      setIsImageLoading(false)
      setImageError(undefined)
    }, [])

    const handleImageLoadError = useCallback(() => {
      setIsImageLoading(false)
      setImageError("Não foi possível carregar a imagem")
    }, [])

    // Se não houver problema selecionado, não renderiza nada
    if (!problem) return null

    // Verifica se o problema é do usuário atual
    const isOwnProblem = problem?.reporterId === session?.user?.id

    // Handler para quando o input recebe foco
    const handleInputFocus = () => {
      // Aguarda um momento para o teclado aparecer
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }

    return (
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={themed($sheetBackground)}
        handleIndicatorStyle={themed($handleIndicator)}
        style={$sheet}
        keyboardBehavior="fillParent"
        android_keyboardInputMode="adjustResize"
      >
        <BottomSheetScrollView
          ref={scrollViewRef}
          contentContainerStyle={$scrollContainer}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        >
          <View style={$container}>
            {/* Cabeçalho */}
            <View style={$header}>
              <View style={$titleContainer}>
                <Text
                  weight="bold"
                  size="xl"
                  text={problem.title}
                  style={themed($title)}
                  numberOfLines={2}
                />
                <TouchableOpacity
                  style={$upvoteContainer}
                  onPress={() => {
                    console.log("🖱️ Botão de upvote pressionado")
                    handleUpvote()
                  }}
                  disabled={!session?.user?.id}
                  hitSlop={20}
                >
                  <View style={$upvoteInnerContainer}>
                    <MaterialCommunityIcons
                      name="fire"
                      size={24}
                      color={
                        hasUpvoted ? themed($upvoteActive).color : themed($upvoteInactive).color
                      }
                    />
                    <Text
                      text={upvoteCount.toString()}
                      style={[themed($upvoteCount), hasUpvoted && themed($upvoteCountActive)]}
                    />
                  </View>
                </TouchableOpacity>
              </View>
              <View style={$categoryContainer}>
                <Text text={category?.icon} style={$categoryIcon} />
                <Text text={category?.label} style={themed($categoryLabel)} />
              </View>
            </View>

            {/* Imagem do problema */}
            {signedImageUrl && (
              <View>
                <TouchableOpacity onPress={handleImagePress}>
                  <View style={$imageContainer}>
                    <Image
                      source={{ uri: signedImageUrl }}
                      style={$problemImage}
                      onLoadStart={handleImageLoadStart}
                      onLoad={handleImageLoadSuccess}
                      onError={handleImageLoadError}
                    />
                    {isImageLoading && (
                      <View style={$loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.tint} />
                      </View>
                    )}
                    {imageError ? (
                      <Text
                        preset="formHelper"
                        tx="map:problem.details.image.error"
                        style={themed($imageError)}
                      />
                    ) : (
                      <Text
                        preset="formHelper"
                        tx="map:problem.details.image.hint"
                        style={themed($imageHint)}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Visualizador de imagem em tela cheia */}
            <ImageView
              images={signedImageUrl ? [{ uri: signedImageUrl }] : []}
              imageIndex={0}
              visible={visible}
              onRequestClose={() => setIsVisible(false)}
            />

            {/* Descrição */}
            <Text text={problem.description} style={themed($description)} />

            {/* Status */}
            <View
              style={[themed($statusContainer), themed($statusContainerByStatus(problem.status))]}
            >
              <Text
                weight="medium"
                text={t(`map:problem:status:${problem.status}`)}
                style={[themed($statusText), themed($statusTextByStatus(problem.status))]}
              />
            </View>

            {/* Ações */}
            {problem && session?.user?.id && (
              <>
                {isOwnProblem ? (
                  <View style={themed($warningContainer)}>
                    <Text
                      weight="medium"
                      tx="map:problem.details.actions.error.selfSolve"
                      style={themed($warningText)}
                    />
                  </View>
                ) : (
                  <View style={$actions}>
                    <Button
                      preset="filled"
                      tx={
                        problem.status === "active"
                          ? "map:problem.details.actions.solve"
                          : "map:problem.details.actions.reopen"
                      }
                      onPress={handleProblemAction}
                      disabled={isSubmitting || problemStore.isLoading}
                    />
                  </View>
                )}
              </>
            )}

            {/* Seção de Comentários */}
            <View style={$commentsSection}>
              <Text
                weight="medium"
                size="lg"
                tx="map:problem.details.comments.title"
                style={themed($commentsTitle)}
              />

              {/* Lista de Comentários */}
              <View style={$commentsList}>
                {commentStore.comments
                  .filter((c) => c.problemId === problem?.id)
                  .map((comment) => (
                    <View key={comment.id} style={$commentItem}>
                      <View style={$commentHeader}>
                        <Text
                          weight="medium"
                          text={comment.username}
                          style={themed($commentUsername)}
                        />
                        <Text
                          text={new Date(comment.createdAt).toLocaleDateString()}
                          style={themed($commentDate)}
                        />
                      </View>
                      <Text text={comment.comment} style={themed($commentText)} />
                    </View>
                  ))}
              </View>

              {/* Input de Comentário */}
              {session?.user?.id && (
                <View style={$commentInputContainer}>
                  <BottomSheetTextInput
                    style={themed($commentInput)}
                    placeholderTextColor={themed($commentInputPlaceholder).color}
                    placeholder={t("map:problem.details.comments.input.placeholder")}
                    value={newComment}
                    onChangeText={setNewComment}
                    multiline
                    onFocus={handleInputFocus}
                  />
                  <TouchableOpacity
                    onPress={handleSendComment}
                    disabled={!newComment.trim()}
                    style={[
                      $sendButton,
                      themed($sendButtonThemedStyle),
                      !newComment.trim() && themed($sendButtonDisabled),
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="send"
                      size={20}
                      color={
                        !newComment.trim()
                          ? themed($sendButtonDisabled).color
                          : themed($sendButtonThemedStyle).color
                      }
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    )
  },
)

const $sheet: ViewStyle = {
  zIndex: 100,
}

const $sheetBackground: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
})

const $handleIndicator: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.border,
  width: 32,
})

const $container: ViewStyle = {
  flex: 1,
  padding: spacing.md,
  gap: spacing.md,
}

const $header: ViewStyle = {
  gap: spacing.xs,
}

const $titleContainer: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: spacing.sm,
}

const $title: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  flex: 1,
})

const $upvoteContainer: ViewStyle = {
  paddingTop: spacing.xxs,
}

const $upvoteInnerContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
}

const $upvoteActive: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.angry500,
})

const $upvoteInactive: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $upvoteCount: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.textDim,
})

const $upvoteCountActive: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.angry500,
})

const $categoryContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
}

const $categoryIcon: TextStyle = {
  fontSize: 16,
}

const $categoryLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $problemImage: ImageStyle = {
  width: "100%",
  height: 200,
  borderRadius: 8,
  marginBottom: spacing.md,
}

const $description: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
})

const $statusContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  alignSelf: "flex-start",
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.sm,
  borderRadius: spacing.xxs,
  borderWidth: 1,
  borderColor: colors.border,
})

const $statusContainerByStatus =
  (status: string): ThemedStyle<ViewStyle> =>
  ({ colors }) => ({
    backgroundColor:
      status === "active"
        ? colors.palette.neutral100
        : status === "solved"
          ? colors.palette.neutral200
          : colors.palette.neutral300,
    borderColor:
      status === "active"
        ? colors.palette.primary300
        : status === "solved"
          ? colors.palette.neutral300
          : colors.palette.neutral400,
  })

const $statusText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
})

const $statusTextByStatus =
  (status: string): ThemedStyle<TextStyle> =>
  ({ colors }) => ({
    color:
      status === "active"
        ? colors.palette.primary500
        : status === "solved"
          ? colors.palette.neutral600
          : colors.palette.neutral700,
  })

const $actions: ViewStyle = {
  marginTop: spacing.sm,
}

const $warningContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral100,
  padding: spacing.sm,
  borderRadius: spacing.xs,
  borderWidth: 1,
  borderColor: colors.palette.angry500,
  marginTop: spacing.xs,
})

const $warningText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.angry500,
  textAlign: "center",
})

const $commentsSection: ViewStyle = {
  gap: spacing.sm,
}

const $commentsTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
})

const $commentsList: ViewStyle = {
  gap: spacing.xs,
}

const $commentItem: ViewStyle = {
  gap: spacing.xxs,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.sm,
  backgroundColor: "transparent",
}

const $commentHeader: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
}

const $commentUsername: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 14,
})

const $commentDate: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 12,
})

const $commentText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 14,
})

const $commentInputContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "flex-end",
  gap: spacing.xs,
  marginTop: spacing.xs,
}

const $commentInput: ThemedStyle<TextStyle> = ({ colors }) => ({
  flex: 1,
  minHeight: 40,
  maxHeight: 100,
  borderRadius: spacing.xs,
  borderWidth: 1,
  borderColor: colors.border,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  color: colors.text,
  backgroundColor: colors.background,
})

const $commentInputPlaceholder: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $sendButton: ViewStyle = {
  padding: spacing.xs,
  borderRadius: spacing.xxs,
  justifyContent: "center",
  alignItems: "center",
}

const $sendButtonThemedStyle: ThemedStyle<ViewStyle & { color: string }> = ({ colors }) => ({
  backgroundColor: colors.palette.primary100,
  color: colors.palette.primary500,
})

const $sendButtonDisabled: ThemedStyle<ViewStyle & { color: string }> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral100,
  color: colors.textDim,
})

const $scrollContainer: ViewStyle = {
  flexGrow: 1,
}

const $imageHint: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  textAlign: "center",
  marginTop: spacing.xxxs,
})

const $imageContainer: ViewStyle = {
  position: "relative",
}

const $loadingContainer: ViewStyle = {
  ...StyleSheet.absoluteFillObject,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "rgba(0,0,0,0.1)",
}

const $imageError: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.error,
  textAlign: "center",
  marginTop: spacing.xxxs,
})

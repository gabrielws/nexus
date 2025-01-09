import { useState } from 'react'
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Button, Icon, Text, TextField } from '@/components'
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native'
import { colors, spacing, type ThemedStyle } from '@/theme'
import { useAppTheme } from '@/utils/useAppTheme'
import { PROBLEM_CATEGORIES } from '@/config/categories'
import { useImagePicker } from '../hooks/useImagePicker'
import type { ProblemCategory, ProblemFormData } from '@/types/types'

interface ProblemModalProps {
  visible: boolean
  onClose: () => void
  onSubmit: (data: Omit<ProblemFormData, 'location'>) => Promise<void>
}

export function ProblemModal({ visible, onClose, onSubmit }: ProblemModalProps) {
  const { themed } = useAppTheme()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ProblemCategory | ''>('')
  const [titleError, setTitleError] = useState(false)
  const [descriptionError, setDescriptionError] = useState(false)
  const [categoryError, setCategoryError] = useState(false)
  const [categoryModalVisible, setCategoryModalVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    problemImage,
    imageError,
    setProblemImage,
    setImageError,
    handleSelectPhoto,
    handleTakePhoto,
  } = useImagePicker()

  const handleSubmit = async () => {
    // Reset errors
    setTitleError(false)
    setDescriptionError(false)
    setCategoryError(false)
    setImageError(false)

    let hasError = false

    if (!title.trim()) {
      setTitleError(true)
      hasError = true
    }

    if (!description.trim()) {
      setDescriptionError(true)
      hasError = true
    }

    if (!category) {
      setCategoryError(true)
      hasError = true
    }

    if (!problemImage) {
      setImageError(true)
      hasError = true
    }

    if (hasError)
      return

    setIsSubmitting(true)

    try {
      await onSubmit({
        title,
        description,
        category: category as ProblemCategory,
        image: problemImage,
      })

      // Reset form após submissão bem-sucedida
      setTitle('')
      setDescription('')
      setCategory('')
      setProblemImage('')
    }
    finally {
      setIsSubmitting(false)
    }
  }

  const handleSelectCategory = (selectedCategory: ProblemCategory) => {
    setCategory(selectedCategory)
    setCategoryError(false)
    setCategoryModalVisible(false)
  }

  const handleClose = () => {
    // Reset form
    setTitle('')
    setDescription('')
    setCategory('')
    setProblemImage('')
    // Reset errors
    setTitleError(false)
    setDescriptionError(false)
    setCategoryError(false)
    setImageError(false)
    onClose()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Pressable
        style={themed($modalContainer)}
        onPress={handleClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}
          style={themed($modalWrapper)}
        >
          <Pressable style={themed($modalContent)}>
            <View style={themed($header)}>
              <Text
                preset="subheading"
                text="Adicionar Problema"
                style={themed($modalTitle)}
              />
            </View>

            <View style={themed($contentWrapper)}>
              <ScrollView
                style={themed($scrollView)}
                contentContainerStyle={themed($scrollContent)}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={themed($formContainer)}>
                  <View style={themed($inputContainer)}>
                    <TextField
                      label="Título"
                      value={title}
                      onChangeText={(text) => {
                        setTitle(text)
                        setTitleError(false)
                      }}
                      placeholder="Digite um título"
                      status={titleError ? 'error' : undefined}
                    />
                  </View>

                  <View style={themed($inputContainer)}>
                    <Button
                      preset="default"
                      onPress={() => setCategoryModalVisible(true)}
                      style={[themed($typeButton), categoryError && themed($errorBorder)]}
                    >
                      {category ? PROBLEM_CATEGORIES.find(c => c.id === category)?.label : 'Selecione a categoria'}
                    </Button>
                  </View>

                  <View style={themed($inputContainer)}>
                    <TextField
                      label="Descrição"
                      value={description}
                      onChangeText={(text) => {
                        setDescription(text)
                        setDescriptionError(false)
                      }}
                      multiline
                      numberOfLines={4}
                      placeholder="Descreva o problema"
                      status={descriptionError ? 'error' : undefined}
                    />
                  </View>

                  <View style={themed($photoContainer)}>
                    <View style={themed($photoButtons)}>
                      <Button
                        preset="default"
                        onPress={handleSelectPhoto}
                        style={[themed($photoButton), imageError && themed($errorBorder)]}
                        LeftAccessory={() => <Icon icon="gallery" style={{ marginRight: 5 }} size={20} />}
                      >
                        Galeria
                      </Button>
                      <Button
                        preset="default"
                        onPress={handleTakePhoto}
                        style={[themed($photoButton), imageError && themed($errorBorder)]}
                        LeftAccessory={() => <Icon icon="camera" style={{ marginRight: 5 }} size={20} />}
                      >
                        Tirar foto
                      </Button>
                    </View>

                    {problemImage && (
                      <View style={themed($imagePreviewContainer)}>
                        <Image source={{ uri: problemImage }} style={themed($previewImage)} />
                        <Pressable
                          style={themed($removeImageButton)}
                          onPress={() => setProblemImage('')}
                        >
                          <Icon icon="x" size={20} color={colors.palette.neutral100} />
                        </Pressable>
                      </View>
                    )}

                    {!problemImage && imageError && (
                      <Text style={themed($errorText)}>
                        Preencha todos os campos.
                      </Text>
                    )}
                  </View>
                </View>
              </ScrollView>
            </View>

            <View style={themed($buttonContainer)}>
              <Button
                text="Cancelar"
                style={themed($button)}
                preset="default"
                onPress={handleClose}
              />
              <Button
                text={isSubmitting ? 'Adicionando...' : 'Salvar'}
                style={themed($button)}
                preset="filled"
                onPress={handleSubmit}
                disabled={isSubmitting}
              />
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>

      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryModalVisible(false)}
        statusBarTranslucent
      >
        <View
          style={themed($modalContainer)}
          onTouchEnd={() => setCategoryModalVisible(false)}
        >
          <View
            style={[themed($modalContent), themed($typeModalContent)]}
            onTouchEnd={e => e.stopPropagation()}
          >
            <Text
              preset="subheading"
              text="Selecione a categoria do problema"
              style={themed($modalTitle)}
            />

            <View style={themed($typeOptionsContainer)}>
              {PROBLEM_CATEGORIES.map(category => (
                <Button
                  key={category.id}
                  text={category.label}
                  preset="default"
                  style={themed($typeOption)}
                  onPress={() => handleSelectCategory(category.id)}
                />
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  )
}

const $modalContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.palette.overlay50,
  justifyContent: 'center',
  alignItems: 'center',
})

const $modalWrapper: ThemedStyle<ViewStyle> = () => ({
  width: '90%',
  maxHeight: '80%',
  margin: spacing.lg,
  flex: 1,
})

const $modalContent: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderRadius: spacing.sm,
  overflow: 'hidden',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: colors.palette.neutral300,
})

const $scrollView: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $scrollContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.md,
})

const $formContainer: ThemedStyle<ViewStyle> = () => ({
  gap: spacing.sm,
})

const $modalTitle: ThemedStyle<TextStyle> = () => ({
  fontWeight: 'bold',
  marginBottom: 8,
  textAlign: 'center',
})

const $inputContainer: ThemedStyle<ViewStyle> = () => ({
  marginBottom: 15,
})

const $typeButton: ThemedStyle<ViewStyle> = () => ({
  marginTop: 4,
})

const $buttonContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: 'row',
  justifyContent: 'flex-end',
  gap: 8,
  marginTop: spacing.xs,
  backgroundColor: colors.background,
  padding: spacing.md,
  borderTopWidth: 1,
  borderTopColor: colors.separator,
})

const $button: ThemedStyle<ViewStyle> = () => ({
  minWidth: 100,
  flex: 1,
  maxWidth: '45%',
})

const $typeModalContent: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  padding: 16,
  width: '80%',
  backgroundColor: colors.background,
  borderRadius: spacing.sm,
  maxHeight: Platform.OS === 'ios' ? '70%' : '80%',
  alignItems: 'center',
})

const $typeOption: ThemedStyle<ViewStyle> = () => ({
  marginVertical: 4,
  width: '100%',
  justifyContent: 'center',
  paddingHorizontal: spacing.md,
})

const $photoContainer: ThemedStyle<ViewStyle> = () => ({
  marginBottom: 15,
})

const $photoButtons: ThemedStyle<ViewStyle> = () => ({
  flexDirection: 'row',
  gap: 8,
  marginBottom: 10,
})

const $photoButton: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $errorText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.error,
})

const $errorBorder: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.error,
  borderWidth: 1,
})

const $imagePreviewContainer: ThemedStyle<ViewStyle> = () => ({
  position: 'relative',
})

const $previewImage: ThemedStyle<ImageStyle> = () => ({
  width: '100%',
  height: 200,
  borderRadius: 8,
  marginBottom: 10,
})

const $removeImageButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: 'absolute',
  top: 8,
  right: 8,
  backgroundColor: colors.palette.overlay50,
  borderRadius: 20,
  padding: 8,
})

const $typeOptionsContainer: ThemedStyle<ViewStyle> = () => ({
  width: '100%',
})

const $contentWrapper: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  minHeight: 0,
})

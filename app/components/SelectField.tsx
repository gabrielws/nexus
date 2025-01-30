import { useState } from "react"
import { ViewStyle, View, TextStyle, Pressable, ScrollView, Modal } from "react-native"
import { observer } from "mobx-react-lite"
import { Text } from "./Text"
import { spacing } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import type { ThemedStyle } from "@/theme"

export interface SelectOption<T extends string> {
  value: T
  label: string
  icon?: string
}

export interface SelectFieldProps<T extends string> {
  /**
   * Valor selecionado
   */
  value: T
  /**
   * Opções disponíveis
   */
  options: SelectOption<T>[]
  /**
   * Callback quando uma opção é selecionada
   */
  onValueChange: (value: T) => void
  /**
   * Label do campo
   */
  label?: string
  /**
   * Placeholder quando nenhum valor selecionado
   */
  placeholder?: string
  /**
   * Mensagem de erro
   */
  error?: string
  /**
   * Se o componente está desabilitado
   */
  disabled?: boolean
}

/**
 * Campo de seleção que abre um modal com as opções.
 * Exemplo:
 * ```tsx
 * <SelectField
 *   label="Categoria"
 *   value={category}
 *   options={[
 *     { value: "a", label: "Opção A", icon: "🅰️" },
 *     { value: "b", label: "Opção B", icon: "🅱️" },
 *   ]}
 *   onValueChange={setCategory}
 * />
 * ```
 */
export const SelectField = observer(function SelectField<T extends string>(
  props: SelectFieldProps<T>,
) {
  const {
    value,
    options,
    onValueChange,
    label,
    placeholder = "Selecione uma opção",
    error,
    disabled,
  } = props
  const { themed } = useAppTheme()
  const [isOpen, setIsOpen] = useState(false)

  const selectedOption = options.find((option) => option.value === value)

  const handleSelect = (newValue: T) => {
    onValueChange(newValue)
    setIsOpen(false)
  }

  return (
    <View style={$container}>
      {label && <Text preset="formLabel" text={label} style={themed($label)} />}

      <Pressable
        style={[themed($field), error && themed($fieldError), disabled && themed($fieldDisabled)]}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        {selectedOption ? (
          <View style={$selectedContainer}>
            {selectedOption.icon && <Text text={selectedOption.icon} style={$optionIcon} />}
            <Text
              text={selectedOption.label}
              style={[themed($value), disabled && themed($valueDisabled)]}
            />
          </View>
        ) : (
          <Text
            text={placeholder}
            style={[themed($placeholder), disabled && themed($placeholderDisabled)]}
          />
        )}
      </Pressable>

      {error && <Text preset="formHelper" text={error} style={themed($error)} />}

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={themed($overlay)} onPress={() => setIsOpen(false)}>
          <View style={themed($modal)}>
            <View style={themed($modalHeader)}>
              <Text preset="formLabel" text={label || "Selecione"} style={themed($modalTitle)} />
              <Pressable onPress={() => setIsOpen(false)}>
                <Text text="✕" style={themed($closeIcon)} />
              </Pressable>
            </View>

            <ScrollView style={themed($modalContent)}>
              {options.map((option) => (
                <Pressable
                  key={option.value}
                  style={[themed($option), option.value === value && themed($optionSelected)]}
                  onPress={() => handleSelect(option.value)}
                >
                  {option.icon && <Text text={option.icon} style={$optionIcon} />}
                  <Text
                    text={option.label}
                    style={[
                      themed($optionText),
                      option.value === value && themed($optionTextSelected),
                    ]}
                  />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  )
})

const $container: ViewStyle = {
  gap: spacing.xs,
}

const $label: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
})

const $field: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  borderRadius: spacing.xs,
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: colors.background,
})

const $fieldError: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.error,
})

const $fieldDisabled: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.separator,
})

const $selectedContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
}

const $value: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
})

const $valueDisabled: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $placeholder: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $placeholderDisabled: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $error: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.error,
})

const $overlay: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.background + "CC", // 80% opacity
  justifyContent: "flex-end",
})

const $modal: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
  borderTopLeftRadius: spacing.lg,
  borderTopRightRadius: spacing.lg,
  maxHeight: "80%",
})

const $modalHeader: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  padding: spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: colors.border,
})

const $modalTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 18,
})

const $closeIcon: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 24,
})

const $modalContent: ViewStyle = {
  padding: spacing.sm,
}

const $option: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  borderRadius: spacing.xs,
  gap: spacing.xs,
})

const $optionSelected: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.tint,
})

const $optionIcon: TextStyle = {
  fontSize: 16,
}

const $optionText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
})

const $optionTextSelected: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.background,
})

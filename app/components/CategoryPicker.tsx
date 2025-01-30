import { FC } from "react"
import { observer } from "mobx-react-lite"
import { SelectField, SelectOption } from "./SelectField"
import { ProblemCategory } from "@/models/ProblemStore"

export const CATEGORIES: Array<SelectOption<ProblemCategory>> = [
  { value: ProblemCategory.Infrastructure, label: "Infraestrutura", icon: "🏗️" },
  { value: ProblemCategory.Maintenance, label: "Manutenção", icon: "🔧" },
  { value: ProblemCategory.Security, label: "Segurança", icon: "🚨" },
  { value: ProblemCategory.Cleaning, label: "Limpeza e Higiene", icon: "🧹" },
  { value: ProblemCategory.Technology, label: "Tecnologia", icon: "💻" },
  { value: ProblemCategory.Educational, label: "Recursos Pedagógicos", icon: "📚" },
  { value: ProblemCategory.Social, label: "Convivência", icon: "👥" },
  { value: ProblemCategory.Sustainability, label: "Sustentabilidade", icon: "♻️" },
]

export interface CategoryPickerProps {
  /**
   * Categoria selecionada
   */
  value: ProblemCategory
  /**
   * Callback quando uma categoria é selecionada
   */
  onValueChange: (value: ProblemCategory) => void
  /**
   * Label do campo
   */
  label?: string
  /**
   * Mensagem de erro
   */
  error?: string
  /**
   * Se o componente está desabilitado
   */
  disabled?: boolean
}

export const CategoryPicker: FC<CategoryPickerProps> = observer(function CategoryPicker(props) {
  const { value, onValueChange, label, error, disabled } = props

  return (
    <SelectField
      value={value}
      options={CATEGORIES}
      onValueChange={onValueChange}
      label={label}
      error={error}
      disabled={disabled}
      placeholder="Selecione uma categoria"
    />
  )
})

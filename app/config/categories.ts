import type { ProblemCategory } from '@/types/types'

interface CategoryConfig {
  id: ProblemCategory
  label: string
  icon: string // nome do ícone do @expo/vector-icons
  description: string
}

export const PROBLEM_CATEGORIES: CategoryConfig[] = [
  {
    id: 'infrastructure',
    label: 'Infraestrutura',
    icon: 'construction',
    description: 'Problemas estruturais como buracos, rachaduras, etc.',
  },
  {
    id: 'security',
    label: 'Segurança',
    icon: 'shield',
    description: 'Questões relacionadas à segurança',
  },
  {
    id: 'cleaning',
    label: 'Limpeza',
    icon: 'trash',
    description: 'Problemas de limpeza e conservação',
  },
  {
    id: 'accessibility',
    label: 'Acessibilidade',
    icon: 'wheelchair',
    description: 'Questões de acesso e mobilidade',
  },
  {
    id: 'other',
    label: 'Outros',
    icon: 'dots-three',
    description: 'Outros tipos de problemas',
  },
]

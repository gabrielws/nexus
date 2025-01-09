import type { AppStackScreenProps } from '@/navigators'
import type { Feature, FeatureCollection, Point } from 'geojson'

// Props do componente principal
export interface MapScreenProps extends AppStackScreenProps<'Map'> {}

// Status possíveis de um problema
export type ProblemStatus = 'active' | 'solved' | 'invalid'

// Categorias de problemas (podemos expandir conforme necessário)
export type ProblemCategory =
  | 'infrastructure'
  | 'security'
  | 'cleaning'
  | 'accessibility'
  | 'other'

// Propriedades de um problema
export interface ProblemProperties {
  id: string
  title: string
  description: string
  category: ProblemCategory
  image_url?: string
  status: ProblemStatus
  reporter_id: string
  solver_id?: string
  reported_at: string
  solved_at?: string
  updated_at: string
  upvotes_count?: number
  comments_count?: number
}

// Feature de um problema individual
export type ProblemFeature = Feature<Point, ProblemProperties>

// Coleção de problemas
export type ProblemCollection = FeatureCollection<Point, ProblemProperties>

// Coordenadas iniciais do mapa
export interface MapCoordinates {
  centerCoordinate: [number, number]
  zoomLevel: number
  pitch: number
  heading: number
}

// Tipos de ações do usuário (baseado no enum action_type do SQL)
export type ActionType = 'report_problem' | 'solve_problem' | 'daily_check_in' | 'feedback_response'

// Interface para níveis
export interface LevelConfig {
  level: number
  xp_required: number
  title: string
  description?: string
}

// Interface para recompensas de ações
export interface ActionReward {
  action: ActionType
  xp_reward: number
  description: string
}

// Interface para ações do usuário
export interface UserAction {
  id: string
  user_id: string
  action: ActionType
  xp_earned: number
  reference_id?: string
  created_at: string
}

// Interface para perfil do usuário
export interface UserProfile {
  id: string
  username: string
  avatar_url?: string
  current_xp: number
  current_level: number
  current_streak: number
  max_streak: number
  last_check_in?: string
  problems_reported: number
  problems_solved: number
  last_level_shown?: number
  created_at: string
  updated_at: string
}

// Interface para formulário de problema
export interface ProblemFormData {
  title: string
  description: string
  category: ProblemCategory
  image?: string
  location: [number, number]
}

// Interface para estatísticas do usuário
export interface UserStats {
  total_xp: number
  problems_reported: number
  problems_solved: number
  current_streak: number
  max_streak: number
  current_level: number
  next_level_xp: number
  progress_to_next_level: number
}

// Interface para filtros de problemas
export interface ProblemFilters {
  status?: ProblemStatus
  category?: ProblemCategory
  reporter_id?: string
  solver_id?: string
  dateRange?: {
    start: string
    end: string
  }
}

// Interface para respostas de erro da API
export interface ApiError {
  message: string
  code?: string
  details?: unknown
}

// Interface para respostas de sucesso da API
export interface ApiResponse<T> {
  data: T
  error: null | ApiError
}

// Interface para configurações do usuário
export interface UserSettings {
  notifications: boolean
  mapDefaultView: MapCoordinates
  language: string
  theme: 'light' | 'dark' | 'system'
}

// Interface para notificações
export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'problem_solved' | 'level_up' | 'achievement' | 'system'
  read: boolean
  created_at: string
}

// Interface para comentários
export interface ProblemComment {
  id: string
  comment: string
  created_at: string
  user_id: string
  profiles: {
    username: string
    avatar_url: string | null
  }
}

// Interface para upvotes
export interface ProblemUpvote {
  id: string
  problem_id: string
  user_id: string
  created_at: string
}

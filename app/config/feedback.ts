export const FEEDBACK_CONFIG = {
  XP_REWARD: 25,
  TRIGGERS: {
    PROBLEMS_SOLVED: 3, // Mostra após resolver 3 problemas
    LEVEL_UP: true, // Mostra após subir de nível
  },
  // Tipos de perguntas suportadas
  TYPES: {
    LIKERT: 'likert',
  } as const,
}

// Tipos para uso no TypeScript
export type FeedbackType = keyof typeof FEEDBACK_CONFIG.TYPES

export interface FeedbackQuestion {
  id: string
  question: string
  type: FeedbackType
}

export interface FeedbackResponse {
  id: string
  userId: string
  questionId: string
  rating: number
  createdAt: string
}

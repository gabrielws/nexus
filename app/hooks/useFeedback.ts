import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/services/auth/supabase'
import type { FeedbackQuestion } from '@/config/feedback'
import { FEEDBACK_CONFIG } from '@/config/feedback'
import { addUserAction } from '@/services/api/addUserAction'

export function useFeedback(userId: string | undefined) {
  const [loading, setLoading] = useState(false)
  const [allQuestions, setAllQuestions] = useState<FeedbackQuestion[]>([])
  const [answeredIds, setAnsweredIds] = useState<string[]>([])

  const fetchQuestions = useCallback(async () => {
    if (!userId)
      return

    try {
      setLoading(true)

      // Buscar nível atual do usuário
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('current_level')
        .eq('id', userId)
        .single()

      if (!profile)
        return

      // Buscar todas as perguntas ativas
      const { data: questions } = await supabase
        .from('feedback_questions')
        .select('*')
        .eq('active', true)
        .limit(5)

      // Buscar respostas do usuário
      const { data: responses } = await supabase
        .from('feedback_responses')
        .select('question_id')
        .eq('user_id', userId)
        .eq('level', profile.current_level)

      setAllQuestions(questions || [])
      setAnsweredIds(responses?.map(r => r.question_id) ?? [])
    }
    catch (error) {
      console.error('Error fetching questions:', error)
    }
    finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  // Filtrar perguntas não respondidas
  const unansweredQuestions = allQuestions.filter(q => !answeredIds.includes(q.id))
  const currentQuestion = unansweredQuestions[0]

  const submitResponse = useCallback(async (rating: number) => {
    if (!userId || !currentQuestion)
      return false

    try {
      setLoading(true)

      // Buscar nível atual do usuário
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('current_level')
        .eq('id', userId)
        .single()

      if (!profile)
        throw new Error('Profile not found')

      // Verificar se já respondeu
      const { data: existing } = await supabase
        .from('feedback_responses')
        .select('id')
        .eq('user_id', userId)
        .eq('question_id', currentQuestion.id)
        .eq('level', profile.current_level)
        .single()

      if (existing)
        return false

      // Salvar resposta
      const { error } = await supabase
        .from('feedback_responses')
        .insert({
          user_id: userId,
          question_id: currentQuestion.id,
          rating,
          level: profile.current_level,
        })

      if (error)
        throw error

      // Adicionar XP
      await addUserAction(userId, 'feedback_response')

      // Atualizar lista de respondidas localmente
      setAnsweredIds(prev => [...prev, currentQuestion.id])

      return true
    }
    catch (error) {
      console.error('Error submitting response:', error)
      return false
    }
    finally {
      setLoading(false)
    }
  }, [userId, currentQuestion])

  return {
    loading,
    currentQuestion,
    totalQuestions: allQuestions.length,
    currentQuestionIndex: allQuestions.length - unansweredQuestions.length,
    isComplete: unansweredQuestions.length === 0,
    submitResponse,
    fetchQuestions,
  }
}

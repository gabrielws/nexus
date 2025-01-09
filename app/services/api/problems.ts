import { supabase } from '@/services/auth/supabase'
import type { ProblemFeature } from '@/types/types'

export async function fetchProblemDetails(problemId: string) {
  // Buscar contadores
  const [{ data: upvotes }, { data: comments }] = await Promise.all([
    supabase
      .rpc('get_problem_upvotes', { problem_id: problemId }),
    supabase
      .from('problem_comments')
      .select('id', { count: 'exact' })
      .eq('problem_id', problemId),
  ])

  // Atualizar o problema com os contadores
  const { data: problem } = await supabase
    .from('reported_problems')
    .select('*')
    .eq('id', problemId)
    .single()

  return {
    ...problem,
    upvotes_count: upvotes,
    comments_count: comments?.length ?? 0,
  }
}

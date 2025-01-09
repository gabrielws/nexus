import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/services/auth/supabase'

export function useCommentCount(problemId: string | undefined) {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchCount = useCallback(async () => {
    if (!problemId)
      return

    setLoading(true)
    try {
      const { count: commentCount, error } = await supabase
        .from('problem_comments')
        .select('*', { count: 'exact', head: true })
        .eq('problem_id', problemId)

      if (error)
        throw error

      setCount(commentCount || 0)
    }
    catch (error) {
      console.error('Erro ao buscar contagem de comentários:', error)
    }
    finally {
      setLoading(false)
    }
  }, [problemId])

  useEffect(() => {
    fetchCount()
  }, [fetchCount])

  return { count, loading, refetch: fetchCount }
}

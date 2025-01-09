import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/services/auth/supabase'

export function useUpvoteCount(problemId: string | undefined) {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchCount = useCallback(async () => {
    if (!problemId)
      return

    setLoading(true)
    try {
      const { count: upvoteCount, error } = await supabase
        .from('problem_upvotes')
        .select('*', { count: 'exact', head: true })
        .eq('problem_id', problemId)

      if (error)
        throw error

      setCount(upvoteCount || 0)
    }
    catch (error) {
      console.error('Erro ao buscar contagem de upvotes:', error)
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

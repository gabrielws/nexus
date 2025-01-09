import { useEffect, useState } from 'react'
import { supabase } from '@/services/auth/supabase'

export function useUsername(userId?: string) {
  const [username, setUsername] = useState<string>()

  useEffect(() => {
    const fetchUsername = async () => {
      if (!userId)
        return

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('username')
          .eq('id', userId)
          .single()

        if (error)
          throw error

        setUsername(data?.username)
      }
      catch (error) {
        console.error('Erro ao buscar username:', error)
        setUsername('Anônimo')
      }
    }

    fetchUsername()
  }, [userId])

  return username || 'Anônimo'
}

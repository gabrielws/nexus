import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/services/auth/supabase'
import type { ActionType, UserProfile, UserStats } from '@/types/types'
import { addUserAction } from '@/services/api/addUserAction'

export interface UseProfileReturn {
  profile: UserProfile | null
  stats: UserStats | null
  isLoading: boolean
  error: Error | null
  refetchProfile: () => Promise<void>
  addXP: (action: ActionType, referenceId?: string) => Promise<void>
  checkIn: () => Promise<void>
  checkAndUpdateLevelUp: () => Promise<{ shouldShowLevelUp: boolean, level: number }>
}

export function useProfile(userId?: string): UseProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!userId)
      return

    try {
      setIsLoading(true)
      setError(null)

      // Busca o perfil e o próximo nível em uma única query
      const { data, error: queryError } = await supabase
        .rpc('get_profile_with_next_level', { user_id: userId })

      if (queryError)
        throw queryError

      const { profile, next_level } = data

      setProfile(profile)

      // Calcula estatísticas
      setStats({
        total_xp: profile.current_xp,
        problems_reported: profile.problems_reported,
        problems_solved: profile.problems_solved,
        current_streak: profile.current_streak,
        max_streak: profile.max_streak,
        current_level: profile.current_level,
        next_level_xp: next_level?.xp_required ?? Infinity,
        progress_to_next_level: next_level
          ? (profile.current_xp / next_level.xp_required) * 100
          : 100,
      })
    }
    catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao buscar perfil'))
      setProfile(null)
      setStats(null)
    }
    finally {
      setIsLoading(false)
    }
  }, [userId])

  // Adiciona XP por uma ação
  const addXP = useCallback(async (action: ActionType, referenceId?: string) => {
    if (!userId)
      return

    try {
      const success = await addUserAction(userId, action, referenceId)

      if (success) {
        // Atualiza o perfil imediatamente após ganhar XP
        await fetchProfile()
      }
    }
    catch (error) {
      console.error('Error adding XP:', error)
      throw error
    }
  }, [userId, fetchProfile])

  // Realiza check-in diário
  const checkIn = useCallback(async () => {
    if (!userId)
      return

    try {
      setError(null)

      const { error: checkInError } = await supabase
        .rpc('perform_daily_check_in', {
          p_user_id: userId,
        })

      console.log('Check-in response:', { checkInError })

      if (checkInError)
        throw checkInError

      await fetchProfile()
    }
    catch (err) {
      console.error('Check-in error details:', err)
      setError(err instanceof Error ? err : new Error('Erro ao fazer check-in'))
    }
  }, [userId, fetchProfile])

  // Nova função para verificar e atualizar level up
  const checkAndUpdateLevelUp = useCallback(async () => {
    if (!userId || !profile)
      return { shouldShowLevelUp: false, level: profile?.current_level ?? 1 }

    const { data } = await supabase
      .from('user_profiles')
      .select('current_level, last_level_shown')
      .eq('id', userId)
      .single()

    if (data && data.current_level > (data.last_level_shown ?? 1)) {
      // Atualiza last_level_shown
      await supabase
        .from('user_profiles')
        .update({ last_level_shown: data.current_level })
        .eq('id', userId)

      return {
        shouldShowLevelUp: true,
        level: data.current_level,
      }
    }

    return { shouldShowLevelUp: false, level: data?.current_level ?? 1 }
  }, [userId, profile])

  // Carrega o perfil inicialmente
  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // Inscreve-se para atualizações em tempo real
  useEffect(() => {
    if (!userId)
      return

    const subscription = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${userId}`,
        },
        fetchProfile,
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId, fetchProfile])

  return {
    profile,
    stats,
    isLoading,
    error,
    refetchProfile: fetchProfile,
    addXP,
    checkIn,
    checkAndUpdateLevelUp,
  }
}

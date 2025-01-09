import { useEffect } from 'react'
import { useAuth } from '@/services/auth/useAuth'
import { useProfile } from './useProfile'
import { useLevelUp } from '@/contexts/LevelUpContext'
import { supabase } from '@/services/auth/supabase'
import type { UserProfile } from '@/types/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface RealtimePayload {
  new: UserProfile
  old: Partial<UserProfile>
}

export function useLevelUpCheck() {
  const { profile: authProfile } = useAuth()
  const { profile } = useProfile(authProfile?.id)
  const { showLevelUp } = useLevelUp()

  // Verificar level up quando o perfil é carregado inicialmente
  useEffect(() => {
    if (profile?.current_level && profile.current_level > (profile.last_level_shown ?? 1)) {
      showLevelUp(profile.id, profile.current_level)
    }
  }, [profile, showLevelUp])

  // Inscrever para mudanças em tempo real
  useEffect(() => {
    if (!authProfile?.id)
      return

    const channel = supabase.channel('profile-changes')

    channel
      .on<UserProfile>(
        'postgres_changes' as any,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${authProfile.id}`,
        },
        (payload: RealtimePayload) => {
          if (payload.new.current_level > (payload.old.last_level_shown ?? 1)) {
            showLevelUp(payload.new.id, payload.new.current_level)
          }
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [authProfile?.id, showLevelUp])
}

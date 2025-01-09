import { supabase } from '@/services/auth/supabase'
import type { ActionType } from '@/types/types'

export async function addUserAction(userId: string, action: ActionType, referenceId?: string): Promise<boolean> {
  try {
    // 1. Buscar recompensa da ação
    const { data: reward, error: rewardError } = await supabase
      .from('action_rewards')
      .select('xp_reward')
      .eq('action', action)
      .single()

    if (rewardError || !reward) {
      console.error('Erro ao buscar recompensa:', rewardError)
      throw new Error(`No reward found for action: ${action}`)
    }

    // 2. Atualizar XP do usuário primeiro
    const { error: updateError } = await supabase
      .rpc('add_user_xp', {
        p_user_id: userId,
        p_xp_amount: reward.xp_reward,
      })

    if (updateError) {
      console.error('Erro ao atualizar XP:', updateError)
      throw updateError
    }

    // 3. Registrar ação do usuário depois
    const { error: actionError } = await supabase
      .from('user_actions')
      .insert({
        user_id: userId,
        action,
        xp_earned: reward.xp_reward,
        reference_id: referenceId,
      })

    if (actionError) {
      console.error('Erro ao registrar ação:', actionError)
      throw actionError
    }

    // 4. Forçar uma atualização do perfil
    await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    return true
  }
  catch (error) {
    console.error('Error adding user action:', error)
    return false
  }
}

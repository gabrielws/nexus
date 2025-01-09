import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { LevelUpModal } from '@/components/LevelUpModal'
import { supabase } from '@/services/auth/supabase'
import { REWARDS_CONFIG } from '@/config/rewards'

interface LevelUpContextType {
  showLevelUp: (userId: string, newLevel: number) => void
}

const LevelUpContext = createContext<LevelUpContextType>({} as LevelUpContextType)

export function LevelUpProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false)
  const [levelData, setLevelData] = useState<{ userId: string, level: number } | null>(null)

  const handleClose = useCallback(async () => {
    if (!levelData)
      return

    try {
      await supabase
        .from('user_profiles')
        .update({ last_level_shown: levelData.level })
        .eq('id', levelData.userId)

      setVisible(false)
      setLevelData(null)
    }
    catch (error) {
      console.error('Erro ao atualizar último nível:', error)
    }
  }, [levelData])

  const showLevelUp = useCallback((userId: string, newLevel: number) => {
    setLevelData({ userId, level: newLevel })
    setVisible(true)
  }, [])

  const value = useMemo(() => ({ showLevelUp }), [showLevelUp])

  return (
    <LevelUpContext.Provider value={value}>
      {children}
      {levelData && (
        <LevelUpModal
          visible={visible}
          newLevel={levelData.level}
          rewards={REWARDS_CONFIG.LEVELS.find(l => l.level === levelData.level)?.rewards ?? []}
          onClose={handleClose}
          userId={levelData.userId}
        />
      )}
    </LevelUpContext.Provider>
  )
}

export const useLevelUp = () => useContext(LevelUpContext)

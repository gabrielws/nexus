import React, { createContext, useContext, useMemo, useState } from 'react'
import { XPAnimation } from '@/components/XPAnimation'
import { useAuth } from '@/services/auth/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useLevelUp } from '@/contexts/LevelUpContext'

interface XPContextType {
  showXPAnimation: boolean
  xpAmount: number
  message: string
  showXP: (amount: number, message: string) => void
  hideXP: () => void
}

const XPContext = createContext<XPContextType | undefined>(undefined)

export function XPProvider({ children }: { children: React.ReactNode }) {
  const { profile: authProfile } = useAuth()
  const { profile, refetchProfile } = useProfile(authProfile?.id)
  const { showLevelUp } = useLevelUp()
  const [showXPAnimation, setShowXPAnimation] = useState(false)
  const [xpAmount, setXPAmount] = useState(0)
  const [message, setMessage] = useState('')

  const value = useMemo(() => ({
    showXPAnimation,
    xpAmount,
    message,
    showXP: async (amount: number, msg: string) => {
      setXPAmount(amount)
      setMessage(msg)
      setShowXPAnimation(true)
    },
    hideXP: async () => {
      setShowXPAnimation(false)
      await refetchProfile()
      if (profile?.current_level && profile.current_level > (profile.last_level_shown ?? 1)) {
        showLevelUp(profile.id, profile.current_level)
      }
    },
  }), [showXPAnimation, xpAmount, message, profile, showLevelUp, refetchProfile])

  return (
    <XPContext.Provider value={value}>
      {children}
      <XPAnimation
        visible={showXPAnimation}
        xp={xpAmount}
        message={message}
        onComplete={() => value.hideXP()}
      />
    </XPContext.Provider>
  )
}

export function useXP() {
  const context = useContext(XPContext)
  if (!context)
    throw new Error('useXP must be used within XPProvider')
  return context
}

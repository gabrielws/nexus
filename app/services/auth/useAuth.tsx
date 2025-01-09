/* eslint-disable react/no-unstable-context-value */
/* eslint-disable node/prefer-global/process */
import type { AuthResponse, AuthTokenResponsePassword, User } from '@supabase/supabase-js'
import type { PropsWithChildren } from 'react'
import type { Session } from './supabase'
import type { UserProfile } from '@/types/types'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useProfile } from '@/hooks/useProfile'

interface AuthState {
  isAuthenticated: boolean
  token?: Session['access_token']
  isLoading: boolean
  user?: User | null
  profile?: UserProfile | null
}

interface SignInProps {
  email: string
  password: string
}

interface SignUpProps {
  email: string
  password: string
  username: string
}

interface AuthContextType extends AuthState {
  signIn: (props: SignInProps) => Promise<AuthTokenResponsePassword>
  signUp: (props: SignUpProps) => Promise<AuthResponse>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  token: undefined,
  isLoading: true,
  user: null,
  profile: null,
  signIn: () => new Promise(() => ({})),
  signUp: () => new Promise(() => ({})),
  signOut: () => new Promise(() => undefined),
  refreshProfile: () => new Promise(() => undefined),
})

export function useAuth() {
  const value = useContext(AuthContext)

  if (process.env.NODE_ENV !== 'production') {
    if (!value)
      throw new Error('useAuth must be used within an AuthProvider')
  }

  return value
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<AuthState['token']>(undefined)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const { profile, refetchProfile } = useProfile(user?.id)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      switch (event) {
        case 'SIGNED_OUT':
          setToken(undefined)
          setUser(null)
          break
        case 'INITIAL_SESSION':
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          setToken(session?.access_token)
          setUser(session?.user ?? null)
          if (session?.user)
            await refetchProfile()
          break
        default:
        // no-op
      }
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [refetchProfile])

  const signIn = useCallback(async ({ email, password }: SignInProps) => {
    try {
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (result.error)
        throw result.error

      if (result.data?.session?.access_token) {
        setToken(result.data.session.access_token)
        await refetchProfile()
      }

      return result
    }
    catch (error) {
      console.error('Erro ao fazer login:', error)
      throw error
    }
  }, [refetchProfile])

  const signUp = useCallback(async ({ email, password, username }: SignUpProps) => {
    try {
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      })

      if (result.error)
        throw result.error

      if (result.data?.user) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError)
          throw signInError
      }

      return result
    }
    catch (error) {
      console.error('Erro ao criar conta:', error)
      throw error
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      setToken(undefined)
      setUser(null)
    }
    catch (error) {
      console.error('Erro ao fazer logout:', error)
      throw error
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        token,
        isLoading,
        user,
        profile,
        signIn,
        signUp,
        signOut,
        refreshProfile: refetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

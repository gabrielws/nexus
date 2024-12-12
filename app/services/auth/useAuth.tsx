/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unstable-context-value */
/* eslint-disable node/prefer-global/process */
import type { AuthResponse, AuthTokenResponsePassword } from '@supabase/supabase-js'
import type {
  PropsWithChildren,
} from 'react'
import type { Session } from './supabase'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { supabase } from './supabase'

interface AuthState {
  isAuthenticated: boolean
  token?: Session['access_token']
}

interface SignInProps {
  email: string
  password: string
}

interface SignUpProps {
  email: string
  password: string
}

type AuthContextType = {
  signIn: (props: SignInProps) => Promise<AuthTokenResponsePassword>
  signUp: (props: SignUpProps) => Promise<AuthResponse>
  signOut: () => void
} & AuthState

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  token: undefined,
  signIn: () => new Promise(() => ({})),
  signUp: () => new Promise(() => ({})),
  signOut: () => undefined,
})

export function useAuth() {
  const value = useContext(AuthContext)

  if (process.env.NODE_ENV !== 'production') {
    if (!value) {
      throw new Error('useAuth must be used within an AuthProvider')
    }
  }

  return value
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<AuthState['token']>(undefined)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      switch (event) {
        case 'SIGNED_OUT':
          setToken(undefined)
          break
        case 'INITIAL_SESSION':
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          setToken(session?.access_token)
          break
        default:
        // no-op
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const signIn = useCallback(
    async ({ email, password }: SignInProps) => {
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (result.data?.session?.access_token) {
        setToken(result.data.session.access_token)
      }

      return result
    },
    [supabase],
  )

  const signUp = useCallback(
    async ({ email, password }: SignUpProps) => {
      const result = await supabase.auth.signUp({
        email,
        password,
      })

      if (result.data?.session?.access_token) {
        setToken(result.data.session.access_token)
      }

      return result
    },
    [supabase],
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setToken(undefined)
  }, [supabase])

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        token,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { Session, supabase } from "./supabase"
import { AuthResponse, AuthTokenResponsePassword } from "@supabase/supabase-js"

type AuthState = {
  isAuthenticated: boolean
  token?: Session["access_token"]
  isLoading: boolean
}

type SignInProps = {
  email: string
  password: string
}

type SignUpProps = {
  email: string
  password: string
}

type AuthContextType = {
  signIn: (props: SignInProps) => Promise<AuthTokenResponsePassword>
  signUp: (props: SignUpProps) => Promise<AuthResponse>
  signOut: () => void
  session?: Session | null
} & AuthState

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  token: undefined,
  session: null,
  isLoading: true,
  signIn: () => new Promise(() => ({})),
  signUp: () => new Promise(() => ({})),
  signOut: () => undefined,
})

export function useAuth() {
  const value = useContext(AuthContext)

  if (process.env.NODE_ENV !== "production") {
    if (!value) {
      throw new Error("useAuth must be used within an AuthProvider")
    }
  }

  return value
}

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [token, setToken] = useState<AuthState["token"]>(undefined)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        setToken(session.access_token)
        setSession(session)
      }
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      switch (event) {
        case "SIGNED_OUT":
          setToken(undefined)
          setSession(null)
          break
        case "INITIAL_SESSION":
        case "SIGNED_IN":
        case "TOKEN_REFRESHED":
          setToken(session?.access_token)
          setSession(session)
          break
        default:
        // no-op
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async ({ email, password }: SignInProps) => {
    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (result.data?.session?.access_token) {
      setToken(result.data.session.access_token)
    }

    return result
  }, [])

  const signUp = useCallback(async ({ email, password }: SignUpProps) => {
    const result = await supabase.auth.signUp({
      email,
      password,
    })

    if (result.data?.session?.access_token) {
      setToken(result.data.session.access_token)
    }

    return result
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setToken(undefined)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        token,
        session,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

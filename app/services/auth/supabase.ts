import { createClient } from '@supabase/supabase-js'
import Config from 'app/config'
import * as SessionStorage from 'app/utils/storage/sessionStorage'
import { AppState } from 'react-native'

export const supabase = createClient(Config.supabaseUrl, Config.supabaseAnonKey, {
  auth: {
    storage: SessionStorage,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})

export { type AuthError, type Session } from '@supabase/supabase-js'

/**
 * Tells Supabase to autorefresh the session while the application
 * is in the foreground. (Docs: https://supabase.com/docs/reference/javascript/auth-startautorefresh)
 */
AppState.addEventListener('change', (nextAppState) => {
  if (nextAppState === 'active') {
    supabase.auth.startAutoRefresh()
  }
  else {
    supabase.auth.stopAutoRefresh()
  }
})

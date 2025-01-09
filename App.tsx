import App from '@/app'
import * as SplashScreen from 'expo-splash-screen'
import '@expo/metro-runtime'
import Toast from 'react-native-toast-message'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from '@/services/auth/useAuth'

SplashScreen.preventAutoHideAsync()

function IgniteApp() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <App hideSplashScreen={SplashScreen.hideAsync} />
        <Toast />
      </AuthProvider>
    </SafeAreaProvider>
  )
}

export default IgniteApp
